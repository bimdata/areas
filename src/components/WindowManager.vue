<script>
import Window from "./Window.vue";
import WindowContainer from "./WindowContainer.vue";
export default {
  name: "WindowManager",
  data() {
    return {
      layout: null
    };
  },
  props: {
    cfg: {
      type: Object,
      required: true
    }
  },
  render(h) {
    console.log("window manager render")
    return h("div", { class: "window-manager" }, [
      makeWindowContainer(h, this.layout.windows, this.layout.direction)
    ]);
  },
  created() {
    this.parseCfg(this.cfg);
    Object.getPrototypeOf(this.$root).$windowManager = {
      context: {
        get window() {
          console.log("try to get window")
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
      if (winId1 === winId2) return;
      const win1Layer = this.findWindowLayer(winId1);
      const win2Layer = this.findWindowLayer(winId2);

      const window1 = this.getWindow(winId1);
      const window2 = this.getWindow(winId2);

      win1Layer.windows.splice(win1Layer.windows.indexOf(window1), 1, window2);
      win2Layer.windows.splice(win2Layer.windows.indexOf(window2), 1, window1);

      // TODO rerender should occure

      win1Layer.windows = Array.from(win1Layer.windows);
      win2Layer.windows = Array.from(win2Layer.windows);

      this.layout = Object.assign({}, this.layout);
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
            return {
              type: "window",
              id: idGen(),
              component: win,
              instance: null
            };
          }
        })
      };
    }
  }
};

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

const containerIdGen = makeIdGenerator();
function makeWindowContainer(h, windows, direction = "row") {
  const containerId = containerIdGen();
  return h(
    WindowContainer,
    { props: { direction }, key: `winContainer${containerId}` },
    windows.map(win => {
      //TODO type check to be sure that this is a component or a window container config
      if (win.windows) {
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
      key: win.id,
      props: { id: win.id },
      on: { created: instance => (win.instance = instance) }
    },
    [h("div", { domProps: { id: getDOMWindowId(win.id) } })]
  );
}
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
