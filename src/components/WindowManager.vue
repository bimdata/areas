<script>
import Teleport from "./Teleport.vue";
import makeLayoutComponent from "./Layout.js";

export default {
  name: "WindowManager",
  data() {
    return {
      draggingWindowId: null,
      contentWindowMap: new Map(),
      layoutComponent: null,
      containerIdGen: makeIdGenerator(),
      containerKeyGen: makeIdGenerator()
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
    deleteWindow(windowId) {
      this.$refs.layout.deleteWindow(windowId);
    },
    getNextWindowId() {
      return this.windows[this.windows.length - 1].id + 1;
    },
    splitWindow(windowId, direction = "row", e) {
      console.log("slit windows");
      this.$refs.layout.splitWindow(windowId, direction, e);
    },
    updateContainerRatio(containerId, newRatios) {
      this.$refs.layout.updateContainerRatio(containerId, newRatios);
    },
    swapWindows(windowId1, windowId2) {
      const getContent = id =>
        [...this.contentWindowMap.entries()].find(
          ([content, winId]) => winId === id
        )[0];
      const win1Content = getContent(windowId1);
      const win2Content = getContent(windowId2);

      this.contentWindowMap.set(win1Content, windowId2);
      this.contentWindowMap.set(win2Content, windowId1);

      // Maps are not reactive :/
      this.contentWindowMap = new Map(this.contentWindowMap);
    },
    parseCfg(cfg) {
      const idGen = makeIdGenerator();
      const layout = this.parseLayer(cfg, idGen);
      this.layoutComponent = makeLayoutComponent(layout);
    },
    parseLayer(layer, idGen) {
      if (layer.ratios) {
        // TODO may test aray type and percentage sum
        // this.windowsRatio = Array(this.windows.length);
        // this.windowsRatio.fill(100 / this.windows.length);
        // // Ensure that the sum of all element is 100
        // const [, ...headElements] = Array.from(this.windowsRatio);
        // const sumHeadElements = headElements.reduce(sum);
        // this.windowsRatio[this.windowsRatio.length - 1] = 100 - sumHeadElements;
      }
      return {
        type: "layer",
        id: this.containerIdGen(),
        key: this.containerKeyGen(),
        direction: layer.direction,
        ratios: layer.ratios,
        windows: layer.windows.map(win => {
          if (win.windows) {
            return this.parseLayer(win, idGen);
          } else {
            const windowObject = {
              type: "window",
              id: idGen()
            };
            const contentObject = {
              id: windowObject.id, // TODO is it usefull to be used as key to not rerender it ?
              component: win
            };
            this.contentWindowMap.set(contentObject, windowObject.id);
            return windowObject;
          }
        })
      };
    },
    getTeleports(h) {
      return [...this.contentWindowMap.entries()].map(
        ([windowContent, windowId]) =>
          h(
            Teleport,
            {
              props: {
                target: getDOMWindowId(windowId)
              },
              ref: "teleports",
              refInFor: true
            },
            [h(windowContent.component)]
          )
      );
    }
  },
  render(h) {
    console.log("window manager render");
    return h("div", { class: "window-manager" }, [
      // ...this.getTeleports(h),
      h(this.layoutComponent, { ref: "layout" })
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
