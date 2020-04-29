<script>
import Teleport from "./Teleport.vue";
import makeLayoutComponent from "./Layout.js";

export default {
  name: "WindowManager",
  data() {
    return {
      draggingWindowId: null,
      windowsContent: [],
      layoutComponent: null,
      containerIdGen: makeIdGenerator(), // TODO find a way to get rid of it
      containerKeyGen: makeIdGenerator() // TODO find a way to get rid of it
    };
  },
  props: {
    cfg: {
      type: Object,
      required: true
    }
  },
  created() {
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
        component: {
          render: h => h("div", ["empty component"])
        }
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
      const idGen = makeIdGenerator();
      const layout = this.parseLayer(cfg, idGen);
      this.layoutComponent = makeLayoutComponent(layout);
    },
    parseLayer(layer, idGen) {
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
            return this.parseLayer(child, idGen);
          } else {
            const windowObject = {
              type: "window",
              id: idGen()
            };
            const contentObject = {
              component: child,
              id: windowObject.id
            };
            this.windowsContent[windowObject.id] = contentObject;
            return windowObject;
          }
        })
      };
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
                      target: getDOMWindowId(windowId)
                    },
                    ref: "teleports",
                    refInFor: true,
                    key: windowContent.id // needed to do not rerender components
                  },
                  [h(windowContent.component)]
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

const getDOMWindowId = id => `window-${id}`;

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
