import Area from "./Area.vue";
import Container from "./Container.vue";

export default (layout, { separatorThickness, separatorMargin }) => ({
  name: "Layout",
  inject: ["areas"],
  data() {
    return {
      layout
    }
  },
  computed: {
    containers() {
      return getNestedContainers(this.layout);
    },
    areas() {
      return getNestedAreas(this.layout);
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
    getNextAreaId() {
      return this.areas.getNextAreaId();
    },
    getNextContainerId() {
      return this.areas.getNextContainerId();
    },
    getNextContainerKey() {
      return this.areas.getNextContainerKey();
    },
    getAreaContainer(areaId) {
      return this.containers.find(container =>
        container.children.filter(child => child.type === "area").map(area => area.id).includes(areaId)
      );
    },
    getArea(id) {
      return this.areas.find(area => area.id === id);
    },
    getAreaInstances() {
      return this.$refs.areas;
    },
    getContainer(id) {
      return this.containers.find(container => container.id === id);
    },
    updateContainerTreeKeys(container) {
      container.key = this.getNextContainerKey();
      this.getContainerAncestors(container).forEach(
        ancestorContainer => (ancestorContainer.key = this.getNextContainerKey())
      );
    },
    updateContainerRatio(containerId, ratios) {
      const container = this.getContainer(containerId);
      container.ratios.splice(0, ratios.length, ...ratios);
    },
    splitArea(areaId, way, percentage, insertNewAfter) {
      const firstRatio = percentage
      const secondRatio = 100 - firstRatio;
      const direction = way === "vertical" ? "row" : "column";
      const container = this.getAreaContainer(areaId);
      const newAreaId = this.getNextAreaId();
      const newAreaObject = {
        id: newAreaId,
        type: "area"
      };
      if (!container) {
        // area is root
        const children = insertNewAfter ? [this.layout, newAreaObject] : [newAreaObject, this.layout];
        this.layout = {
          type: "container",
          id: this.getNextContainerId(),
          key: this.getNextContainerKey(),
          direction,
          ratios: [firstRatio, secondRatio],
          children
        };
      } else {
        // area is in container
        const containerAreaObject = container.children.filter(child => child.type === "area").find(
          area => area.id === areaId
        );
        const areaIndex = container.children.indexOf(containerAreaObject);
        const areaRatio = container.ratios[areaIndex];
        const newFirstRatio = firstRatio / 100 * areaRatio;
        const newSecondRatio = areaRatio - newFirstRatio;
        if (container.direction === direction) {
          container.children.splice(
            areaIndex + (insertNewAfter ? 1 : 0),
            0,
            newAreaObject
          );
          container.ratios.splice(areaIndex, 1, newFirstRatio, newSecondRatio);
        } else {
          const children = insertNewAfter ? [containerAreaObject, newAreaObject] : [newAreaObject, containerAreaObject];
          const newContainer = {
            type: "container",
            id: this.getNextContainerId(),
            key: this.getNextContainerKey(),
            direction,
            ratios: [firstRatio, secondRatio],
            children
          };
          container.children.splice(areaIndex, 1, newContainer);
        }
        this.updateContainerTreeKeys(container);
      }
      return newAreaId;
    },
    mergeRatios(container, areaIndex) {
      if (areaIndex === 0) {
        const firstRatio = container.ratios.shift();
        const secondRatio = container.ratios.shift();
        container.ratios.unshift(firstRatio + secondRatio);
        const deletedArea = container.children.shift();
        this.updateContainerTreeKeys(container, false);
        return deletedArea;
      } else {
        const areaToDeleteRatio = container.ratios[areaIndex];
        const previousAreaRatio = container.ratios[areaIndex - 1];

        const deletedAreas = container.ratios.splice(
          areaIndex - 1,
          2,
          areaToDeleteRatio + previousAreaRatio
        );

        container.children.splice(areaIndex, 1);
        return deletedAreas[0];
      }
    },
    makeArea(h, area) {
      return h(
        Area, { props: { id: area.id }, ref: "areas", refInFor: true }
      );
    },
    makeContainer(h, container) {
      const { children, direction = "row", id, key } = container;
      return h(
        Container,
        { props: { direction, areasRatio: container.ratios, id, separatorThickness, separatorMargin }, key: `areaContainer${key}` },
        children.map(child => {
          if (child.type === "container") {
            return this.makeContainer(h, child);
          } else {
            return this.makeArea(h, child);
          }
        })
      );
    },
    deleteContainer(container, areaIndex) {
      const parentContainer = this.getContainerParent(container);
      container.children.splice(areaIndex, 1);
      const remainingArea = container.children.pop();
      if (parentContainer) {
        const containerIndex = parentContainer.children.findIndex(
          child => child.type === "container" && child.id === container.id
        );
        parentContainer.children.splice(containerIndex, 1, remainingArea);
      } else {
        this.layout = remainingArea;
      }
    },
    deleteArea(areaId) {
      const container = this.getAreaContainer(areaId);
      if (!container) {
        throw `Cannot delete area with id "${areaId}" because this is the root area.`;
      }
      const areaObject = container.children.filter(child => child.type === "area").find(area => area.id === areaId);
      const areaIndex = container.children.indexOf(areaObject);
      if (container.children.length > 2) {
        this.mergeRatios(container, areaIndex);
        this.updateContainerTreeKeys(container, false);
      } else {
        const parentContainer = this.getContainerParent(container);
        this.deleteContainer(container, areaIndex);
        if (parentContainer) {
          this.updateContainerTreeKeys(parentContainer, false);
        }
      }
    }
  },
  render(h) {
    return this.layout.type === "container"
      ? this.makeContainer(h, this.layout)
      : this.makeArea(h, this.layout);
  }
});

const getAreas = container => container.children.filter(child => child.type === "area");
const getContainers = container => container.children.filter(child => child.type === "container");

const getNestedAreas = container =>
  container.type === "container"
    ? [
      ...getAreas(container),
      ...getContainers(container)
        .map(getNestedAreas)
        .flat()
    ]
    : [container];

const getNestedContainers = container => {
  if (container.type === "area") {
    return [];
  }
  const childContainers = getContainers(container);
  if (childContainers.length) {
    return [container, ...childContainers.map(getNestedContainers).flat()];
  } else {
    return [container];
  }
};
