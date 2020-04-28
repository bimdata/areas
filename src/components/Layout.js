import Window from "./Window.vue";
import WindowContainer from "./WindowContainer.vue";

export default layout => ({
  name: "Layout",
  data() {
    return {
      layout
    }
  },
  computed: {
    layers() {
      return getNestedLayers(this.layout);
    },
    windows() {
      return getNestedWindows(this.layout);
    }
  },
  methods: {
    getLayerParent(layer) {
      return this.layers.length ? this.layers.find(parentLayer => parentLayer.windows.includes(layer)) : null;
    },
    getLayerAncestors(layer) {
      const ancestors = [];
      let parentLayer = this.getLayerParent(layer);
      while (parentLayer) {
        ancestors.push(parentLayer);
        parentLayer = this.getLayerParent(parentLayer);
      }
      return ancestors;
    },
    getNextWindowId() {
      return this.windows.sort(sortBy("id"))[this.windows.length - 1].id + 1;
    },
    getNextLayerId() {
      return this.layers.length ? this.layers.sort(sortBy("id"))[this.layers.length - 1].id + 1 : 1;
    },
    getNextLayerKey() {
      return this.layers.length ? this.layers.sort(sortBy("key"))[this.layers.length - 1].key + 1 : 1;
    },
    getWindowLayer(winId) {
      return this.layers.find(layer =>
        layer.windows.filter(win => win.type === "window").map(win => win.id).includes(winId)
      );
    },
    getWindow(id) {
      return this.windows.find(win => win.id === id);
    },
    getLayer(id) {
      return this.layers.find(layer => layer.id === id);
    },
    updateLayerTreeKeys(layer) {
      // TODO change naming
      let nextkey = this.getNextLayerKey();
      layer.key = nextkey++;
      this.getLayerAncestors(layer).forEach(
        ancestorLayer => (ancestorLayer.key = nextkey++)
      );
    },
    updateContainerRatio(containerId, ratios) {
      const layer = this.getLayer(containerId);
      layer.ratios.splice(0, ratios.length, ...ratios);
    },
    splitWindow(windowId, direction = "row", e) {
      const layer = this.getWindowLayer(windowId);
      const newWindowId = this.getNextWindowId();
      const newWindowObject = {
        id: newWindowId,
        type: "window"
      };
      if (!layer) {
        // window is root
        this.layout = {
          type: "layer",
          id: this.getNextLayerId(),
          key: this.getNextLayerKey(),
          direction,
          ratios: [50, 50],
          windows: [this.layout, newWindowObject]
        };
      } else {
        // window is in layer
        const layerWindowObject = layer.windows.find(
          win => win.id === windowId
        );
        const windowIndex = layer.windows.indexOf(layerWindowObject);
        const windowRatio = layer.ratios[windowIndex];
        if (layer.direction === direction) {
          layer.windows.splice(
            windowIndex + 1, // TODO +1 mean at the right of the splitted one... configurable?
            0,
            newWindowObject
          );
          layer.ratios.splice(windowIndex, 1, windowRatio / 2, windowRatio / 2);
        } else {
          const newLayer = {
            type: "layer",
            id: this.getNextLayerId(),
            key: this.getNextLayerKey(),
            direction,
            ratios: [50, 50],
            windows: [
              layerWindowObject,
              {
                id: this.getNextWindowId(),
                type: "window"
              }
            ]
          };
          layer.windows.splice(windowIndex, 1, newLayer);
        }
        console.log("update keys");
        this.updateLayerTreeKeys(layer);
      }

      // RerenderChange
    },
    mergeRatios(layer, windowIndex) {
      if (windowIndex === 0) {
        const firstRatio = layer.ratios.shift();
        const secondRatio = layer.ratios.shift();
        layer.ratios.unshift(firstRatio + secondRatio);
        const deletedWindow = layer.windows.shift();
        this.updateLayerTreeKeys(layer, false);
        return deletedWindow;
      } else {
        const windowToDeleteRatio = layer.ratios[windowIndex];
        const previousWindowRatio = layer.ratios[windowIndex - 1];

        const deletedWindows = layer.ratios.splice(
          windowIndex - 1,
          2,
          windowToDeleteRatio + previousWindowRatio
        );

        layer.windows.splice(windowIndex, 1);
        return deletedWindows[0];
      }
    },
    deleteLayer(layer, windowIndex) {
      // delete the container
      const parentLayer = this.getLayerParent(layer);
      layer.windows.splice(windowIndex, 1);
      const remainingWindow = layer.windows.pop();
      if (parentLayer) {
        const layerIndex = parentLayer.windows.findIndex(
          win => win.type === "layer" && win.id === layer.id
        );
        parentLayer.windows.splice(layerIndex, 1, remainingWindow);
      } else {
        this.layout = remainingWindow;
      }
    },
    deleteWindow(windowId) {
      const layer = this.getWindowLayer(windowId);
      if (!layer)
        throw `Cannont delete window with id "${windowId}" because this is the root window.`;
      const windowObject = layer.windows.find(win => win.id === windowId);
      const windowIndex = layer.windows.indexOf(windowObject);
      if (layer.windows.length > 2) {
        this.mergeRatios(layer, windowIndex);
        this.updateLayerTreeKeys(layer, false);
      } else {
        const parentLayer = this.getLayerParent(layer);
        this.deleteLayer(layer, windowIndex);
        if (parentLayer) {
          this.updateLayerTreeKeys(parentLayer, false);
        }
      }
    }
  },
  render(h) {
    return this.layout.type === "layer"
      ? makeWindowContainer(h, this.layout)
      : makeWindow(h, this.layout);
  }
});

function makeWindowContainer(h, layer) {
  const { windows, direction = "row", id, key } = layer;
  return h(
    WindowContainer,
    { props: { direction, windowsRatio: layer.ratios, id }, key },
    windows.map(win => {
      if (win.windows) {
        // If windows property, layer, window otherwise
        return makeWindowContainer(h, win);
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

const getNestedWindows = layer =>
  layer.type === "layer"
    ? [
      ...getWindows(layer),
      ...getLayers(layer)
        .map(getNestedWindows)
        .flat()
    ]
    : [layer];

const getNestedLayers = layer => {
  if (layer.type === "window") {
    return [];
  }
  const childLayers = getLayers(layer);
  if (childLayers.length) {
    return [layer, ...childLayers.map(getNestedLayers).flat()];
  } else {
    return [layer]; // TODO can we go here ?
  }
};

const sortBy = p => (a, b) => (a[p] > b[p] ? 1 : a[p] < b[p] ? -1 : 0);

const getDOMWindowId = id => `window-${id}`;
