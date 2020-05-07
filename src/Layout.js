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
    containers() {
      return getNestedContainers(this.layout);
    },
    windows() {
      return getNestedWindows(this.layout);
    }
  },
  updated() {
    this.$emit("updated");
  },
  methods: {
    getLayout() {
      return this.layout;
    },
    getContainerParent(container) {
      return this.containers.length ? this.containers.find(parentContainer => parentContainer.children.includes(container)) : null;
    },
    getContainerAncestors(container) {
      const ancestors = [];
      let parentContainer = this.getContainerParent(container);
      while (parentContainer) {
        ancestors.push(parentContainer);
        parentContainer = this.getContainerParent(parentContainer);
      }
      return ancestors;
    },
    getNextWindowId() {
      return this.windowManager.getNextWindowId();
    },
    getNextContainerId() {
      return this.windowManager.getNextContainerId();
    },
    getNextContainerKey() {
      return this.windowManager.getNextContainerId();
    },
    getWindowContainer(winId) {
      return this.containers.find(container =>
        container.children.filter(child => child.type === "window").map(win => win.id).includes(winId)
      );
    },
    getWindow(id) {
      return this.windows.find(win => win.id === id);
    },
    getWindowInstances() {
      return this.$refs.windows;
    },
    getContainer(id) {
      return this.containers.find(container => container.id === id);
    },
    updateContainerTreeKeys(container) {
      // TODO change naming
      container.key = this.getNextContainerKey();
      this.getContainerAncestors(container).forEach(
        ancestorContainer => (ancestorContainer.key = this.getNextContainerKey())
      );
    },
    updateContainerRatio(containerId, ratios) {
      const container = this.getContainer(containerId);
      container.ratios.splice(0, ratios.length, ...ratios);
    },
    splitWindow(windowId, way, percentage, insertNewAfter = true) {
      if (!["vertical", "horizontal"].includes(way)) {
        throw `Cannot split window. Bad way. Only accept "vertical" or "horizontal", get "${way}"`;
      }
      const firstRatio = percentage
      const secondRatio = 100 - firstRatio;
      const direction = way === "vertical" ? "row" : "column";
      const container = this.getWindowContainer(windowId);
      const newWindowId = this.getNextWindowId();
      const newWindowObject = {
        id: newWindowId,
        type: "window"
      };
      if (!container) {
        // window is root
        const children = insertNewAfter ? [this.layout, newWindowObject] : [newWindowObject, this.layout];
        this.layout = {
          type: "container",
          id: this.getNextContainerId(),
          key: this.getNextContainerKey(),
          direction,
          ratios: [firstRatio, secondRatio],
          children
        };
      } else {
        // window is in container
        const containerWindowObject = container.children.filter(child => child.type === "window").find(
          win => win.id === windowId
        );
        const windowIndex = container.children.indexOf(containerWindowObject);
        const windowRatio = container.ratios[windowIndex];
        const newFirstRatio = firstRatio / 100 * windowRatio;
        const newSecondRatio = windowRatio - newFirstRatio;
        if (container.direction === direction) {
          container.children.splice(
            windowIndex + (insertNewAfter ? 1 : 0),
            0,
            newWindowObject
          );
          container.ratios.splice(windowIndex, 1, newFirstRatio, newSecondRatio);
        } else {
          const children = insertNewAfter ? [containerWindowObject, newWindowObject] : [newWindowObject, containerWindowObject];
          const newContainer = {
            type: "container",
            id: this.getNextContainerId(),
            key: this.getNextContainerKey(),
            direction,
            ratios: [firstRatio, secondRatio],
            children
          };
          container.children.splice(windowIndex, 1, newContainer);
        }
        this.updateContainerTreeKeys(container);
      }
      return newWindowId;
    },
    mergeRatios(container, windowIndex) {
      if (windowIndex === 0) {
        const firstRatio = container.ratios.shift();
        const secondRatio = container.ratios.shift();
        container.ratios.unshift(firstRatio + secondRatio);
        const deletedWindow = container.children.shift();
        this.updateContainerTreeKeys(container, false);
        return deletedWindow;
      } else {
        const windowToDeleteRatio = container.ratios[windowIndex];
        const previousWindowRatio = container.ratios[windowIndex - 1];

        const deletedWindows = container.ratios.splice(
          windowIndex - 1,
          2,
          windowToDeleteRatio + previousWindowRatio
        );

        container.children.splice(windowIndex, 1);
        return deletedWindows[0];
      }
    },
    makeWindow(h, win) {
      return h(
        Window, { props: { id: win.id }, ref: "windows", refInFor: true }
      );
    },
    makeWindowContainer(h, container) {
      const { children, direction = "row", id, key } = container;
      return h(
        WindowContainer,
        { props: { direction, windowsRatio: container.ratios, id }, key: `windowContainer${key}` },
        children.map(child => {
          if (child.type === "container") {
            return this.makeWindowContainer(h, child);
          } else {
            return this.makeWindow(h, child);
          }
        })
      );
    },
    deleteContainer(container, windowIndex) {
      const parentContainer = this.getContainerParent(container);
      container.children.splice(windowIndex, 1);
      const remainingWindow = container.children.pop();
      if (parentContainer) {
        const containerIndex = parentContainer.children.findIndex(
          child => child.type === "container" && child.id === container.id
        );
        parentContainer.children.splice(containerIndex, 1, remainingWindow);
      } else {
        this.layout = remainingWindow;
      }
    },
    deleteWindow(windowId) {
      const container = this.getWindowContainer(windowId);
      if (!container)
        throw `Cannont delete window with id "${windowId}" because this is the root window.`;
      const windowObject = container.children.filter(child => child.type === "window").find(win => win.id === windowId);
      const windowIndex = container.children.indexOf(windowObject);
      if (container.children.length > 2) {
        this.mergeRatios(container, windowIndex);
        this.updateContainerTreeKeys(container, false);
      } else {
        const parentContainer = this.getContainerParent(container);
        this.deleteContainer(container, windowIndex);
        if (parentContainer) {
          this.updateContainerTreeKeys(parentContainer, false);
        }
      }
    }
  },
  render(h) {
    return this.layout.type === "container"
      ? this.makeWindowContainer(h, this.layout)
      : this.makeWindow(h, this.layout);
  }
});

const getWindows = container => container.children.filter(child => child.type === "window");
const getContainers = container => container.children.filter(child => child.type === "container");

const getNestedWindows = container =>
  container.type === "container"
    ? [
      ...getWindows(container),
      ...getContainers(container)
        .map(getNestedWindows)
        .flat()
    ]
    : [container];

const getNestedContainers = container => {
  if (container.type === "window") {
    return [];
  }
  const childContainers = getContainers(container);
  if (childContainers.length) {
    return [container, ...childContainers.map(getNestedContainers).flat()];
  } else {
    return [container];
  }
};
