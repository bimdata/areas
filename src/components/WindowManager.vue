<script>
import Window from "./Window.vue";
import WindowContainer from "./WindowContainer.vue";
import Teleport from "./Teleport.vue";
export default {
  name: "WindowManager",
  data() {
    return {
      draggingWindowId: null,
      windowsContents: [], // TODO good naming ?
      contentWindowMap: new Map(),
      layout: null
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
  computed: {
    layers() {
      return getNestedLayers(this.layout);
    },
    windows() {
      return getNestedWindows(this.layout).sort(sortById);
    }
  },
  methods: {
    splitWindow(winId1) {},
    swapWindows(winId1, winId2) {
      const getContent = id =>
        [...this.contentWindowMap.entries()].find(
          ([content, winId]) => winId === id
        )[0];
      const win1Content = getContent(winId1);
      const win2Content = getContent(winId2);

      this.contentWindowMap.set(win1Content, winId2);
      this.contentWindowMap.set(win2Content, winId1);

      // Maps are not reactive :/
      this.contentWindowMap = new Map(this.contentWindowMap);
    },
    findWindowLayer(winId) {
      return this.layers.find(layer =>
        layer.windows.map(win => win.id).includes(winId)
      );
    },
    getWindow(id) {
      return this.windows.find(win => win.id === id);
    },
    parseCfg(cfg) {
      const idGen = makeIdGenerator();
      this.layout = this.parseLayer(cfg, idGen);
    },
    parseLayer(layer, idGen) {
      return {
        type: "layer",
        direction: layer.direction,
        windows: layer.windows.map(win => {
          if (win.windows) {
            return this.parseLayer(win, idGen);
          } else {
            const windowObject = {
              type: "window",
              id: idGen()
            };
            const contentObject = {
              component: win
            };
            this.windowsContents.push(contentObject);
            this.contentWindowMap.set(contentObject, windowObject.id);
            return windowObject;
          }
        })
      };
    }
  },
  render(h) {
    console.log("window manager render");
    return h("div", { class: "window-manager" }, [
      ...this.windowsContents.map(windowContent =>
        h(
          Teleport,
          {
            props: {
              target: getDOMWindowId(this.contentWindowMap.get(windowContent))
            }
          },
          [h(windowContent.component)]
        )
      ),
      makeWindowContainer(h, this.layout.windows, this.layout.direction)
    ]);
  }
};

// const containerIdGen = makeIdGenerator();
function makeWindowContainer(h, windows, direction = "row") {
  // const containerId = containerIdGen();
  return h(
    WindowContainer,
    { props: { direction } /*key: `winContainer${containerId}`*/ },
    windows.map(win => {
      if (win.windows) {
        // If windows property, layer, window otherwise
        return makeWindowContainer(h, win.windows, win.direction);
      } else {
        return makeWindow(h, win);
      }
    })
  );
}
function makeWindow(h, win) {
  return h(
    Window,
    {
      // key: win.id,
      props: { id: win.id }
      // on: { created: instance => (win.instance = instance) }
    },
    [h("div", { domProps: { id: getDOMWindowId(win.id) } })]
  );
}

const getWindows = layer => layer.windows.filter(win => win.type === "window");
const getLayers = layer => layer.windows.filter(win => win.type === "layer");

const getNestedWindows = layer => [
  ...getWindows(layer),
  ...getLayers(layer)
    .map(getNestedWindows)
    .flat()
];

const getNestedLayers = layer => {
  const childLayers = getLayers(layer);
  if (childLayers && childLayers.length) {
    return [layer, ...childLayers.map(getNestedLayers).flat()];
  } else {
    return layer;
  }
};

const sortById = (a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0);

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
