<script>
import Teleport from "./Teleport.vue";
import makeLayoutComponent from "./Layout.js";

export default {
  name: "areas",
  props: {
    cfg: {
      type: Object,
      required: true
    },
    zIndexStart: {
      type: Number,
      default: 0
    }
  },
  provide() {
    return {
      areas: this
    };
  },
  data() {
    return {
      mode: null,
      activeAreaId: null,
      areaIdPrefix: null,
      availableComponents: null,
      areasContent: null,
      layoutComponent: null,
      emptyComponent: null,
      containerIdGen: null,
      containerKeyGen: null,
      areaIdGen: null,
      areaContentIdGen: null,
      cursor: null
    };
  },
  computed: {
    swapMode() {
      return this.mode === "swap";
    },
    deleteMode() {
      return this.mode === "delete";
    },
    splitVerticalMode() {
      return this.mode === "split-vertical";
    },
    splitHorizontalMode() {
      return this.mode === "split-horizontal";
    },
    noMode() {
      return this.mode === null;
    }
  },
  created() {
    this.containerIdGen = makeIdGenerator();
    this.containerKeyGen = makeIdGenerator();
    this.areaIdGen = makeIdGenerator();
    this.areaContentIdGen = makeIdGenerator();

    this.parseCfg(this.cfg);
  },
  methods: {
    /******* PARSING CFG *******/
    parseCfg(cfg) {
      // The following values no need to be reative, that is why they are not present on data object
      this.separatorThickness = cfg.separatorThickness;
      this.separatorDetectionMargin = cfg.separatorDetectionMargin;
      this.areaMinRatio = cfg.areaMinRatio;

      this.areaIdPrefix = this.cfg.areaIdPrefix || "area-";
      this.emptyComponent = this.cfg.emptyComponent || {
        render: h => h("div", ["empty component"])
      };
      this.availableComponents = cfg.components;

      const layout = this.parseLayout(cfg.layout);
      this.buildLayout(layout);
    },
    parseLayout(layout) {
      this.areasContent = [];
      return layout.children
        ? this.parseContainer(layout)
        : this.parseArea(layout);
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
        direction: container.direction || "row",
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
    buildLayout(layout) {
      this.layoutComponent = makeLayoutComponent(layout, {
        separatorThickness: this.separatorThickness,
        separatorDetectionMargin: this.separatorDetectionMargin,
        minRatio: this.areaMinRatio
      });
    },
    /******* Methods to be used externally *******/
    loadLayout(layout) {
      this.buildLayout(this.parseLayout(layout));
    },
    getCurrentLayout() {
      const layout = this.$refs.layout.getLayout();
      return this.reverseParseLayout(layout);
    },
    changeAreaComponent(areaId, componentCfg = {}) {
      if (
        !this.areasContent
          .map((areaContent, index) => (areaContent ? index : null))
          .filter(Boolean)
          .includes(areaId)
      ) {
        throw `Impossible to change component. Area id "${areaId}" does not exist.`;
      }
      const { cfg, componentIndex, name } = componentCfg;
      if (
        componentIndex !== null &&
        !Object.keys(this.availableComponents).includes(String(componentIndex))
      ) {
        throw `Impossible to change component. Component index "${componentIndex}" is not available. For empty component, use null.`;
      }
      const id = this.areaContentIdGen();
      const newAreaContentObject = {
        id,
        component:
          componentIndex === null
            ? this.emptyComponent
            : this.availableComponents[componentIndex],
        ...(cfg && { cfg }),
        ...(name && { name })
      };
      this.areasContent.splice(areaId, 1, newAreaContentObject);
    },
    setMode(mode) {
      if (
        mode !== null &&
        !["split-vertical", "split-horizontal", "swap", "delete"].includes(mode)
      ) {
        throw `Mode must be "split-vertical", "split-horizontal", "swap" or "delete", get ${mode}. To exit any mode, call setMode(null)`;
      }
      if (this.mode !== mode) {
        this.mode = mode;
      }
    },
    deleteArea(areaId) {
      this.$refs.layout.deleteArea(areaId);
      this.areasContent.splice(areaId, 1, undefined);
    },
    splitArea(areaId, way, percentage = 50, insertNewAfter = true) {
      if (!["vertical", "horizontal"].includes(way)) {
        throw `Cannot split area this way. Only accept "vertical" or "horizontal", get "${way}".`;
      }
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
        // Wait for the layout to rerender
        this.areasContent = Array.from(this.areasContent);
      });
    },
    swapAreas(areaId1, areaId2) {
      const area1content = this.areasContent[areaId1];
      const area2content = this.areasContent[areaId2];

      this.areasContent.splice(areaId2, 1, area1content);
      this.areasContent.splice(areaId1, 1, area2content);

      this.$nextTick(this.reattachTeleports);
    },
    getComponentByName(name) {
      return this.areasContent
        .filter(Boolean)
        .filter(areaContent => areaContent.name)
        .find(areaContent => areaContent.name === name);
    },
    /******* Methods to be used internally *******/
    onMouseLeave() {
      this.activeAreaId = null;
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
    reverseParseLayout(layout) {
      return layout.type === "container"
        ? this.reverseParseContainer(layout)
        : reverseParseArea(layout);
    },
    reverseParseContainer(container) {
      return {
        direction: container.direction,
        ratios: roundRatios(container.ratios),
        children: container.children.map(child =>
          child.type === "container"
            ? this.reverseParseContainer(child)
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
      // TODO this may be removed if area are exposed to children another way
      return this.$refs.layout.getAreaInstances();
    },
    getArea(id) {
      // TODO this may be removed if area are exposed to children another way
      return this.getAreas().find(area => area.id === id);
    },
    onLayoutUpdated() {
      this.reattachTeleports();
    },
    reattachTeleports() {
      this.$refs.teleports.forEach(teleport => teleport.attach());
    },
    updateContainerRatio(containerId, newRatios) {
      this.$refs.layout.updateContainerRatio(containerId, newRatios);
    },
    getDOMAreaId(id) {
      return `${this.areaIdPrefix}${id}`;
    },
    renderTeleports(h) {
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
        class: "areas",
        style: `cursor: var(--areas-global-cursor, unset); ${this.cursor}`,
        on: { mouseleave: this.onMouseLeave }
      },
      [
        this.renderTeleports(h),
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
.areas {
  background-color: var(--areas-separator-color, darkslategrey);
  height: 100%;
  width: 100%;
  display: flex;
  overflow: hidden;
}
</style>
