<script>
import Teleport from "./Teleport.vue";
import makeLayoutComponent from "./Layout.js";

export default {
  name: "areas",
  data() {
    return {
      dragAndDropMode: false,
      splitMode: null,
      activeAreaId: null,
      areaIdPrefix: null,
      availableComponents: null,
      areasContent: null,
      layoutComponent: null,
      emptyComponent: null,
      containerIdGen: null,
      containerKeyGen: null,
      areaIdGen: null,
      areaContentIdGen: null
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
      areas: this
    };
  },
  methods: {
    changeAreaComponent(areaId, componentCfg = {}) {
      if (
        !this.areasContent
          .map((wc, i) => (wc ? i : null))
          .filter(Boolean)
          .includes(areaId)
      ) {
        throw `Impossible to change component. Area id "${areaId}" does not exist.`;
      }
      const { cfg, componentIndex, name } = componentCfg;
      if (
        !Object.keys(this.availableComponents).includes(String(componentIndex))
      ) {
        throw `Impossible to change component. Component index "${componentIndex}" is not available.`;
      }
      const id = this.areaContentIdGen();
      const newAreaContentObject = {
        id,
        component: this.availableComponents[componentIndex],
        ...(cfg && { cfg }),
        ...(name && { name })
      };
      this.areasContent.splice(areaId, 1, newAreaContentObject);

      // this.reattachTeleports();
    },
    onMouseMove(e) {
      // TODO for development only, may be used by user instead of hardcoded here
      this.setDragAndDropMode(e.metaKey);
      this.setSplitMode(
        e.shiftKey ? "horizontal" : e.altKey ? "vertical" : null
      );
    },
    setSplitMode(mode) {
      if (!["vertical", "horizontal", null].includes(mode)) {
        throw `Split mode can only accept "vertical", "horizontal" or null value, get "${mode}".`;
      }
      if (this.splitMode !== mode) {
        this.splitMode = mode;
      }
    },
    setDragAndDropMode(active = true) {
      this.dragAndDropMode = active;
    },
    setActiveAreaId(id) {
      this.activeAreaId = id;
    },
    getNextAreaId() {
      return this.areaIdGen();
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
      this.areasContent = [];

      if (firstRender) {
        this.containerIdGen = makeIdGenerator();
        this.containerKeyGen = makeIdGenerator();
        this.areaIdGen = makeIdGenerator();
        this.areaContentIdGen = makeIdGenerator();
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
        : reverseParseArea(layout);
    },
    reverseparseContainer(container) {
      return {
        direction: container.direction,
        ratios: roundRatios(container.ratios),
        children: container.children.map(child =>
          child.type === "container"
            ? this.reverseparseContainer(child)
            : this.reverseParseArea(child)
        )
      };
    },
    reverseParseArea(area) {
      const areaContent = this.areasContent[area.id];
      const componentIndex = this.availableComponents.indexOf(
        areaContent.component
      );
      const areaObject = {
        componentIndex: componentIndex === -1 ? null : componentIndex,
        ...(areaContent.cfg && { cfg: areaContent.cfg }), // will not add the property if undefined
        ...(areaContent.name && { name: areaContent.name }) // will not add the property if undefined
      };
      return areaObject;
    },
    getAreas() {
      return this.$refs.layout.getAreaInstances();
    },
    getArea(id) {
      return this.getAreas().find(area => area.id === id);
    },
    onLayoutUpdated() {
      this.reattachTeleports();
    },
    reattachTeleports() {
      this.$refs.teleports.forEach(teleport => teleport.attach());
    },
    deleteArea(areaId) {
      this.$refs.layout.deleteArea(areaId);
      this.areasContent.splice(areaId, 1, undefined);
    },
    splitArea(areaId, way, percentage, insertNewAfter) {
      const newAreaId = this.$refs.layout.splitArea(
        areaId,
        way,
        percentage,
        insertNewAfter
      );
      this.areasContent[newAreaId] = {
        id: this.areaContentIdGen(),
        component: this.emptyComponent
      };

      this.$nextTick(() => {
        this.areasContent = Array.from(this.areasContent);
      });
    },
    updateContainerRatio(containerId, newRatios) {
      this.$refs.layout.updateContainerRatio(containerId, newRatios);
    },
    swapAreas(areaId1, areaId2) {
      const area1content = this.areasContent[areaId1];
      const area2content = this.areasContent[areaId2];

      this.areasContent.splice(areaId2, 1, area1content);
      this.areasContent.splice(areaId1, 1, area2content);

      this.$nextTick(() => this.reattachTeleports());
    },
    parseCfg(cfg) {
      this.areaIdPrefix = this.cfg.areaIdPrefix || "area-";
      this.emptyComponent = this.cfg.emptyComponent || {
        render: h => h("div", ["empty component"])
      };
      this.availableComponents = cfg.components;
      this.buildLayout(cfg.layout, true);
    },
    parseLayout(layout) {
      return layout.children
        ? this.parseContainer(layout)
        : this.parseArea(layout);
    },
    parseArea(area) {
      if (
        area.componentIndex !== null &&
        !this.availableComponents[area.componentIndex]
      ) {
        throw `The component with index "${area.componentIndex}" does not exist. "componentIndex" in cfg.layout must be a valid index in the cfg.components array or null for empty component.`;
      }
      const areaObject = {
        type: "area",
        id: this.areaIdGen()
      };
      const contentObject = {
        name: area.name,
        component:
          area.componentIndex !== null
            ? this.availableComponents[area.componentIndex]
            : this.emptyComponent,
        cfg: area.cfg,
        id: this.areaContentIdGen()
      };
      this.areasContent[areaObject.id] = contentObject;
      return areaObject;
    },
    parseContainer(container) {
      if (container.ratios) {
        if (
          container.ratios.length !== container.children.length ||
          container.ratios.reduce((acc, cur) => acc + cur) !== 100
        ) {
          throw "Container is malformed. Each child must have a ratio and the sum of all ratios must be 100.";
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
            return this.parseArea(child);
          }
        })
      };
    },
    getComponentByName(name) {
      return this.areasContent
        .filter(Boolean)
        .filter(areaContent => areaContent.name)
        .find(areaContent => areaContent.name === name);
    },
    getDOMAreaId(id) {
      return `${this.areaIdPrefix}${id}`;
    },
    getTeleports(h) {
      return h(
        "div",
        { style: "display:none;" },
        this.areasContent
          .map((areaContent, areaId) =>
            areaContent
              ? h(
                  Teleport,
                  {
                    props: {
                      targetId: areaId
                    },
                    on: {
                      mounted({ childInstance }) {
                        areaContent.instance = childInstance; // TODO is it really usefull here ???
                      }
                    },
                    ref: "teleports",
                    refInFor: true,
                    key: `teleportArea${areaContent.id}` // needed to do not rerender components
                  },
                  [h(areaContent.component, { ...areaContent.cfg })]
                )
              : null
          )
          .filter(Boolean)
      );
    }
  },
  render(h) {
    return h(
      "div",
      {
        class: "area-manager",
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
  throw "Cannot generate more ids.";
}

function makeIdGenerator() {
  const gen = idGenerator();
  return () => gen.next().value;
}
</script>

<style scoped>
.area-manager {
  background-color: darkslategrey;
  height: 100%;
  width: 100%;
  display: flex;
}
</style>
