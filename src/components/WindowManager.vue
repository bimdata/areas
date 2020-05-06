<script>
import Teleport from "./Teleport.vue";
import makeLayoutComponent from "./Layout.js";

export default {
  name: "WindowManager",
  data() {
    return {
      dragAndDropMode: false,
      splitMode: null,
      activeWindowId: null,
      windowIdPrefix: null,
      availableComponents: null,
      windowsContent: null,
      layoutComponent: null,
      emptyComponent: null,
      containerIdGen: null,
      containerKeyGen: null,
      windowIdGen: null
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
  },
  provide() {
    return {
      windowManager: this
    };
  },
  methods: {
    onMouseMove(e) {
      // TODO for development only, may be used by user instead of hardcoded here
      this.setDragAndDropMode(e.metaKey);
      this.setSplitMode(
        e.shiftKey ? "horizontal" : e.altKey ? "vertical" : null
      );
    },
    setSplitMode(mode) {
      if (!["vertical", "horizontal", null].includes(mode)) {
        throw `Split mode can only accept "vertical", "horizontal" or null value, get "${mode}"`;
      }
      if (this.splitMode !== mode) {
        this.splitMode = mode;
      }
    },
    setDragAndDropMode(active = true) {
      this.dragAndDropMode = active;
    },
    setActiveWindowId(id) {
      this.activeWindowId = id;
    },
    getNextWindowId() {
      return this.windowIdGen();
    },
    getNextContainerId() {
      return this.containerIdGen();
    },
    getNextContainerKey() {
      return this.containerKeyGen();
    },
    loadLayout(layout) {
      this.buildLayout(layout);
    },
    buildLayout(layout, firstRender = false) {
      this.windowsContent = [];

      if (firstRender) {
        this.containerIdGen = makeIdGenerator();
        this.containerKeyGen = makeIdGenerator();
        this.windowIdGen = makeIdGenerator();
      } else {
        // no need to reattach at first render... optimization
        this.$nextTick(() => this.reattachTeleports());
      }

      this.layoutComponent = makeLayoutComponent(this.parseLayout(layout));
    },
    getCurrentLayout() {
      const layout = this.$refs.layout.getLayout();
      return layout.type === "container"
        ? this.reverseparseContainer(layout)
        : reverseParseWindow(layout);
    },
    reverseparseContainer(container) {
      return {
        direction: container.direction,
        ratios: roundRatios(container.ratios),
        children: container.children.map(child =>
          child.type === "container"
            ? this.reverseparseContainer(child)
            : this.reverseParseWindow(child)
        )
      };
    },
    reverseParseWindow(win) {
      const windowContent = this.windowsContent[win.id];
      const componentIndex = this.availableComponents.indexOf(
        windowContent.component
      );
      const windowObject = {
        componentIndex: componentIndex === -1 ? null : componentIndex,
        ...(windowContent.cfg && { cfg: windowContent.cfg }), // will not add the property if undefined
        ...(windowContent.name && { name: windowContent.name }) // will not add the property if undefined
      };
      return windowObject;
    },
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
    splitWindow(windowId, way, percentage, insertNewAfter) {
      const newWindowId = this.$refs.layout.splitWindow(
        windowId,
        way,
        percentage,
        insertNewAfter
      );
      this.windowsContent[newWindowId] = {
        id: newWindowId,
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
      this.windowIdPrefix = this.cfg.windowIdPrefix || "window-";
      this.emptyComponent = this.cfg.emptyComponent || {
        render: h => h("div", ["empty component"])
      };
      this.availableComponents = cfg.components;
      this.buildLayout(cfg.layout, true);
    },
    parseLayout(layout) {
      return layout.children
        ? this.parseContainer(layout)
        : this.parseWindow(layout); // TODO add more complete type test for cfg
    },
    parseWindow(win) {
      const windowObject = {
        type: "window",
        id: this.windowIdGen()
      };
      const contentObject = {
        name: win.name,
        component:
          win.componentIndex !== null
            ? this.availableComponents[win.componentIndex]
            : this.emptyComponent,
        cfg: win.cfg,
        id: windowObject.id
      };
      this.windowsContent[windowObject.id] = contentObject;
      return windowObject;
    },
    parseContainer(container) {
      if (container.ratios) {
        if (
          container.ratios.length !== container.children.length ||
          container.ratios.reduce((acc, cur) => acc + cur) !== 100
        ) {
          throw "container is malformed. Each child must habe a ratio specifiec and the sum of all ratios must be 100";
        }
      }
      return {
        type: "container",
        id: this.containerIdGen(),
        key: this.containerKeyGen(),
        direction: container.direction,
        ratios: container.ratios,
        children: container.children.map(child => {
          if (child.children) {
            return this.parseContainer(child);
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
    return h(
      "div",
      {
        class: "window-manager",
        on: {
          mousemove: e => this.onMouseMove(e)
        }
      },
      [
        this.getTeleports(h),
        h(this.layoutComponent, {
          ref: "layout",
          on: {
            updated: this.onLayoutUpdated
          }
        })
      ]
    );
  }
};

function roundRatios(ratios) {
  const roundedRatios = ratios.map(Math.round);
  roundedRatios[roundedRatios.length - 1] =
    100 - roundedRatios.slice(0, -1).reduce((a, b) => a + b); // Ensure the sum is 100
  return roundedRatios;
}

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
