import Window from "./Window.vue";
import WindowContainer from "./WindowContainer.vue";

export default layout => ({
  name: "Layout",
  inject: ["windowManager"],
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
  updated() {
    this.$emit("updated");
  },
  methods: {
    getLayerParent(layer) {
      return this.layers.length ? this.layers.find(parentLayer => parentLayer.children.includes(layer)) : null;
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
        layer.children.filter(child => child.type === "window").map(win => win.id).includes(winId)
      );
    },
    getWindow(id) {
      return this.windows.find(win => win.id === id);
    },
    getWindowInstances() {
      return this.$refs.windows;
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
    splitWindow(windowId, way, e) {
      if (!["vertical", "horizontal"].includes(way)) {
        throw `Cannot split window. Bad way. Only accept "vertical" or "horizontal", get "${way}"`;
      }
      const direction = way === "vertical" ? "row" : "column";
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
          children: [this.layout, newWindowObject]
        };
      } else {
        // window is in layer
        const layerWindowObject = layer.children.filter(child => child.type === "window").find(
          win => win.id === windowId
        );
        const windowIndex = layer.children.indexOf(layerWindowObject);
        const windowRatio = layer.ratios[windowIndex];
        if (layer.direction === direction) {
          layer.children.splice(
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
            children: [
              layerWindowObject,
              newWindowObject
            ]
          };
          layer.children.splice(windowIndex, 1, newLayer);
        }
        this.updateLayerTreeKeys(layer);
      }
      return newWindowObject;
    },
    mergeRatios(layer, windowIndex) {
      if (windowIndex === 0) {
        const firstRatio = layer.ratios.shift();
        const secondRatio = layer.ratios.shift();
        layer.ratios.unshift(firstRatio + secondRatio);
        const deletedWindow = layer.children.shift();
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

        layer.children.splice(windowIndex, 1);
        return deletedWindows[0];
      }
    },
    makeWindow(h, win) {
      return h(
        Window, { props: { id: win.id }, ref: "windows", refInFor: true }
      );
    },
    makeWindowContainer(h, layer) {
      const { children, direction = "row", id, key } = layer;
      return h(
        WindowContainer,
        { props: { direction, windowsRatio: layer.ratios, id }, key: `windowContainer${key}` },
        children.map(child => {
          if (child.type === "layer") {
            return this.makeWindowContainer(h, child);
          } else {
            return this.makeWindow(h, child);
          }
        })
      );
    },
    deleteLayer(layer, windowIndex) {
      const parentLayer = this.getLayerParent(layer);
      layer.children.splice(windowIndex, 1);
      const remainingWindow = layer.children.pop();
      if (parentLayer) {
        const layerIndex = parentLayer.children.findIndex(
          child => child.type === "layer" && child.id === layer.id
        );
        parentLayer.children.splice(layerIndex, 1, remainingWindow);
      } else {
        this.layout = remainingWindow;
      }
    },
    deleteWindow(windowId) {
      const layer = this.getWindowLayer(windowId);
      if (!layer)
        throw `Cannont delete window with id "${windowId}" because this is the root window.`;
      const windowObject = layer.children.filter(child => child.type === "window").find(win => win.id === windowId);
      const windowIndex = layer.children.indexOf(windowObject);
      if (layer.children.length > 2) {
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
      ? this.makeWindowContainer(h, this.layout)
      : this.makeWindow(h, this.layout);
  }
});

const getWindows = layer => layer.children.filter(child => child.type === "window");
const getLayers = layer => layer.children.filter(child => child.type === "layer");

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
    return [layer];
  }
};

const sortBy = p => (a, b) => (a[p] > b[p] ? 1 : a[p] < b[p] ? -1 : 0);
