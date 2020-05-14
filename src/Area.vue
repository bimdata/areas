<template>
  <div
    class="area"
    data-test="area"
    :draggable="isDraggable"
    :class="{
      'area-active': isAreaActive,
      'area-active-vertical-splitting': areas.splitVerticalMode,
      'area-active-horizontal-splitting': areas.splitHorizontalMode,
      'area-active-grab': isDraggable && !dragging,
      'area-active-grabbing': dragging,
      }"
    @click="onAreaClick"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @dragenter="onDragEnter"
    @dragstart="onDragStart"
    @drop="onDrop"
    @dragend="onDragEnd"
    @mouseenter="onMouseEnter"
    @mousemove="onMouseMove"
  >
    <!-- TODO the next two elements should be merged as one -->
    <div class="area-overlay" v-if="isOverlayDisplayed"></div>
    <div class="area-overlay-dragover" v-if="dragover && !dragging">
      <div class="dash-area"></div>
    </div>
    <div
      class="area-vertical-split"
      :style="{left: `${verticalSplitLeft}%`}"
      v-if="verticalSplitDisplayed"
    ></div>
    <div
      class="area-horizontal-split"
      :style="{top: `${horizontalSplitTop}%`}"
      v-if="horizontalSplitDisplayed"
    ></div>
    <div class="area-content" :id="areas.getDOMAreaId(id)"></div>
  </div>
</template>

<script>
export default {
  name: "area-component", // cannot use area because it is a reserved HTML keyword
  props: {
    id: { type: Number, require: true }
  },
  inject: ["areas"],
  data() {
    return {
      dragover: false,
      dragging: false,
      verticalSplitLeft: null,
      horizontalSplitTop: null
    };
  },
  computed: {
    isDraggable() {
      return this.areas.swapMode;
    },
    isAreaActive() {
      return this.id === this.areas.activeAreaId;
    },
    isOverlayDisplayed() {
      return !this.isAreaActive && (this.areas.splitMode || this.isDraggable);
    },
    verticalSplitDisplayed() {
      return (
        this.isAreaActive &&
        this.isVerticalSplitMode &&
        this.verticalSplitLeft !== null
      );
    },
    horizontalSplitDisplayed() {
      return (
        this.isAreaActive &&
        this.isHorizontalSplitMode &&
        this.horizontalSplitTop !== null
      );
    },
    isVerticalSplitMode() {
      return this.areas.splitVerticalMode;
    },
    isHorizontalSplitMode() {
      return this.areas.splitHorizontalMode;
    },
    isDeleteMode() {
      return this.areas.deleteMode;
    }
  },
  methods: {
    onDragStart(dragEvent) {
      this.dragging = true;
      dragEvent.dataTransfer.setData("areas-areaid", String(this.id));
      dragEvent.dataTransfer.effectAllowed = "move";
    },
    onDragEnd() {
      this.dragging = false;
    },
    onDrop(dragEvent) {
      this.dragover = false;
      const areaId = parseInt(
        dragEvent.dataTransfer.getData("areas-areaid"),
        10
      );
      this.areas.swapAreas(areaId, this.id);
    },
    onDragEnter(dragEvent) {
      if (dragEvent.dataTransfer.types.includes("areas-areaid")) {
        this.dragover = true;
      }
    },
    onDragOver(dragEvent) {
      if (dragEvent.dataTransfer.types.includes("areas-areaid")) {
        dragEvent.preventDefault();
        dragEvent.dataTransfer.dropEffect = "move";
      }
    },
    onDragLeave(e) {
      this.dragover = false;
    },
    onAreaClick(e) {
      const {
        horizontalPercentage,
        verticalPercentage
      } = this.getLocalMouseCoordinates(e);

      if (this.isVerticalSplitMode) {
        this.areas.splitArea(this.id, "vertical", verticalPercentage);
      } else if (this.isHorizontalSplitMode) {
        this.areas.splitArea(this.id, "horizontal", horizontalPercentage);
      } else if (this.isDeleteMode) {
        this.areas.deleteArea(this.id, e);
      }
    },
    onMouseMove(e) {
      const {
        verticalPercentage,
        horizontalPercentage
      } = this.getLocalMouseCoordinates(e);

      this.verticalSplitLeft = verticalPercentage;
      this.horizontalSplitTop = horizontalPercentage;
    },
    getLocalMouseCoordinates(e) {
      const { height, width, x, y } = this.$el.getBoundingClientRect();
      const { clientX, clientY } = e;
      const top = clientY - y;
      const left = clientX - x;
      const verticalPercentage = (left / width) * 100;
      const horizontalPercentage = (top / height) * 100;

      return {
        top,
        left,
        verticalPercentage,
        horizontalPercentage
      };
    },
    onMouseEnter() {
      if (!this.isAreaActive) {
        this.areas.setActiveAreaId(this.id);
      }
    }
  }
};
</script>

<style scoped>
.area {
  background-color: cornsilk;
  box-sizing: border-box;
  position: relative;
  width: 100%;
  height: 100%;
}
.area-active {
  box-shadow: inset 0 0 5px grey;
}
.area-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(128, 128, 128, 0.199);
}
.area-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(128, 128, 128, 0.199);
}
.area-overlay-dragover {
  position: absolute;
  width: 100%;
  height: 100%;
  padding: 5px;
  box-sizing: border-box;
  pointer-events: none;
}
.dash-area {
  height: 100%;
  box-sizing: border-box;
  border: dashed 5px grey;
}
.area-vertical-split {
  pointer-events: none;
  position: absolute;
  margin-left: -1px;
  width: 3px;
  height: 100%;
  background-color: red;
}
.area-horizontal-split {
  pointer-events: none;
  position: absolute;
  margin-top: -1px;
  width: 100%;
  height: 3px;
  background-color: red;
}
.area-active-vertical-splitting {
  cursor: col-resize;
}
.area-active-horizontal-splitting {
  cursor: row-resize;
}
.area-active-grab {
  cursor: grab;
}
.area-active-grabbing {
  cursor: grabbing;
}
.area-content {
  overflow: scroll;
  width: 100%;
  height: 100%;
}
</style>
