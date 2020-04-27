<script>
import Window from "./Window.vue";
import WindowContainer from "./WindowContainer.vue";
import Teleport from "./Teleport.vue";
export default {
  name: "WindowManager",
  data() {
    return {
      draggingWindowId: null,
      contentWindowMap: new Map(),
      layout: null,
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
  computed: {
    layers() {
      return getNestedLayers(this.layout);
    },
    windows() {
      return getNestedWindows(this.layout).sort(sortById);
    }
  },
  methods: {
    updateContainerRatio(containerId, ratios) {
      const layer = this.getLayer(containerId);
      // Array api methods need to be used for reactivity
      for (let ratio of ratios) {
        layer.ratios.shift();
        layer.ratios.push(ratio);
      }
    },
    splitWindow(windowId, e) {
      // TODO handle vertical or horizontal split
      console.log("slit windows");
      const layer = this.findWindowLayer(windowId);
      const newWindowId = this.windows[this.windows.length - 1].id + 1;
      const newWindowObject = {
        id: newWindowId,
        type: "window"
      };
      // TODO Add empty component to test.. may be remove in prod
      this.contentWindowMap.set(
        {
          id: newWindowId,
          component: {
            render(h) {
              return h("div", ["Empty component"]);
            }
          }
        },
        newWindowId
      );

      const layerWindowObject = layer.windows.find(win => win.id === windowId);
      const windowIndex = layer.windows.indexOf(layerWindowObject);
      layer.windows.splice(
        windowIndex + 1, // TODO +1 mean at the right of the splitted one... configurable?
        0,
        newWindowObject
      );
      const windowRatio = layer.ratios[windowIndex];
      layer.ratios.splice(windowIndex, 1, windowRatio / 2, windowRatio / 2);

      // RerenderChange
      layer.key = this.containerKeyGen();
      getLayerAncestors(layer).forEach(
        ancestorLayer => (ancestorLayer.key = this.containerKeyGen())
      );
      this.$nextTick(() => {
        this.$refs.teleports.forEach(teleport => teleport.attach());
      });
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
    findWindowLayer(winId) {
      return this.layers.find(layer =>
        layer.windows.map(win => win.id).includes(winId)
      );
    },
    getWindow(id) {
      return this.windows.find(win => win.id === id);
    },
    getLayer(id) {
      return this.layers.find(layer => layer.id === id);
    },
    parseCfg(cfg) {
      const idGen = makeIdGenerator();
      this.layout = this.parseLayer(cfg, idGen);
      addParentPropertyToLayers(null, this.layout);
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
    displayLayout(h, layout) {
      return this.makeWindowContainer(h, layout);
    },
    makeWindowContainer(h, layer) {
      const { windows, direction = "row", id, key } = layer;
      return h(
        WindowContainer,
        { props: { direction, windowsRatio: layer.ratios, id }, key },
        windows.map(win => {
          if (win.windows) {
            // If windows property, layer, window otherwise
            return this.makeWindowContainer(h, win);
          } else {
            return makeWindow(h, win);
          }
        })
      );
    }
  },
  render(h) {
    console.log("window manager render");
    return h("div", { class: "window-manager" }, [
      ...[...this.contentWindowMap.entries()].map(([windowContent, windowId]) =>
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
      ),
      this.displayLayout(h, this.layout)
    ]);
  }
};

function getLayerAncestors(layer) {
  const ancestors = [];
  let curentLayer = layer;
  while (curentLayer.parent) {
    ancestors.push(layer.parent);
    curentLayer = layer.parent;
  }
  return ancestors;
}

function addParentPropertyToLayers(parent, layer) {
  layer.parent = parent;
  layer.windows
    .filter(win => win.type === "layer")
    .forEach(childLayer => addParentPropertyToLayers(layer, childLayer));
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
