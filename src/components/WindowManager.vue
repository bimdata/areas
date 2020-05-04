<script>
import Teleport from "./Teleport.vue";
import makeLayoutComponent from "./Layout.js";

export default {
  name: "WindowManager",
  data() {
    return {
      windowIdPrefix: null,
      draggingWindowId: null,
      availableComponents: null,
      windowsContent: [],
      layoutComponent: null,
      emptyComponent: null,
      containerIdGen: makeIdGenerator(),
      containerKeyGen: makeIdGenerator(),
      windowIdGen: makeIdGenerator()
    };
  },
  props: {
    cfg: {
      type: Object,
      required: true
    }
  },
  created() {
    this.windowIdPrefix = this.cfg.windowIdPrefix || "window-";
    this.emptyComponent = this.cfg.emptyComponent || {
      render: h => h("div", ["empty component"])
    };
    this.parseCfg(this.cfg);
    Object.getPrototypeOf(this.$root).$windowManager = {
      context: {
        get window() {
          console.log("try to get window");
        }
      }
    };
  },
  provide() {
    return {
      windowManager: this
    };
  },
  methods: {
    getWindows() {
      return this.$refs.layout.getWindowInstances();
    },
    getWindow(id) {
      return this.getWindows().find(win => win.id === id);
    },
    onLayoutUpdated() {
      console.log("layout updated");
      this.reattachTeleports();
    },
    reattachTeleports() {
      this.$refs.teleports.forEach(teleport => teleport.attach());
    },
    deleteWindow(windowId) {
      this.$refs.layout.deleteWindow(windowId);
      this.windowsContent.splice(windowId, 1, undefined);
    },
    splitWindow(windowId, way, e) {
      const newWindowObject = this.$refs.layout.splitWindow(windowId, way, e);
      this.windowsContent[newWindowObject.id] = {
        id: newWindowObject.id,
        component: this.emptyComponent
      };

      this.$nextTick(() => {
        this.windowsContent = Array.from(this.windowsContent);
      });
    },
    updateContainerRatio(containerId, newRatios) {
      this.$refs.layout.updateContainerRatio(containerId, newRatios);
    },
    swapWindows(windowId1, windowId2) {
      const window1content = this.windowsContent[windowId1];
      const window2content = this.windowsContent[windowId2];

      this.windowsContent.splice(windowId2, 1, window1content);
      this.windowsContent.splice(windowId1, 1, window2content);

      this.$nextTick(() => this.reattachTeleports());
    },
    parseCfg(cfg) {
      this.availableComponents = cfg.components;
      const layout = cfg.layout.children
        ? this.parseLayer(cfg.layout)
        : this.parseWindow(cfg.layout); // TODO add more complete type test for cfg
      this.layoutComponent = makeLayoutComponent(layout);
    },
    parseWindow(win) {
      const windowObject = {
        type: "window",
        id: this.windowIdGen()
      };
      const contentObject = {
        name: win.name,
        component: this.availableComponents[win.componentIndex],
        cfg: win.cfg,
        id: windowObject.id
      };
      this.windowsContent[windowObject.id] = contentObject;
      return windowObject;
    },
    parseLayer(layer) {
      if (layer.ratios) {
        if (
          layer.ratios.length !== layer.children.length ||
          layer.ratios.reduce((acc, cur) => acc + cur) !== 100
        ) {
          throw "Layer is malformed. Each child must habe a ratio specifiec and the sum of all ratios must be 100";
        }
      }
      return {
        type: "layer",
        id: this.containerIdGen(),
        key: this.containerKeyGen(),
        direction: layer.direction,
        ratios: layer.ratios,
        children: layer.children.map(child => {
          if (child.children) {
            return this.parseLayer(child);
          } else {
            return this.parseWindow(child);
          }
        })
      };
    },
    getComponentByName(name) {
      return this.windowsContent
        .filter(Boolean)
        .filter(windowContent => windowContent.name)
        .find(windowContent => windowContent.name === name);
    },
    getDOMWindowId(id) {
      return `${this.windowIdPrefix}${id}`;
    },
    getTeleports(h) {
      return h(
        "div",
        { style: "display:none;" },
        this.windowsContent
          .map((windowContent, windowId) =>
            windowContent
              ? h(
                  Teleport,
                  {
                    props: {
                      targetId: windowId
                    },
                    on: {
                      mounted({ childInstance }) {
                        windowContent.instance = childInstance;
                      }
                    },
                    ref: "teleports",
                    refInFor: true,
                    key: `teleportWindow${windowContent.id}` // needed to do not rerender components
                  },
                  [h(windowContent.component, { ...windowContent.cfg })]
                )
              : null
          )
          .filter(Boolean)
      );
    }
  },
  render(h) {
    console.log("window manager render");
    return h("div", { class: "window-manager" }, [
      this.getTeleports(h),
      h(this.layoutComponent, {
        ref: "layout",
        on: {
          updated: this.onLayoutUpdated
        }
      })
    ]);
  }
};

function* idGenerator() {
  let i = 1;
  while (i < Number.MAX_SAFE_INTEGER) {
    yield i++;
  }
  throw "Cannot generate more ids";
}

function makeIdGenerator() {
  const gen = idGenerator();
  return () => gen.next().value;
}
</script>

<style scoped>
.window-manager {
  background-color: darkslategrey;
  height: 100%;
  width: 100%;
  display: flex;
}
</style>
