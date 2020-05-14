<template>
  <div
    class="area"
    data-test="area"
    :style="{ cursor, zIndex: dragover ? areas.zIndexStart + 2 : isAreaActive ? areas.zIndexStart + 1 : 'unset' }"
    :draggable="isDraggable"
    :class="{ 'area-active': isAreaActive }"
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
    <div
      class="area-overlay"
      :class="{
        'area-overlay-dragover': dragover && !isAreaActive,
        'area-overlay-split': isAreaActive && isSplitMode,
        'area-overlay-swap': isAreaActive && isSwapMode,
        'area-overlay-delete': isAreaActive && isDeleteMode
      }"
      v-if="isOverlayDisplayed"
    ></div>
    <div
      v-if="isSplitMode && isAreaActive"
      class="area-split"
      :class="{
        'area-split-vertical': isVerticalSplitMode,
        'area-split-horizontal': isHorizontalSplitMode,
      }"
      :style="`${isVerticalSplitMode ? 'left' : 'top'}: ${isVerticalSplitMode ? verticalSplitLeft : horizontalSplitTop}%`"
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
      return !this.isNoMode;
    },
    isSplitMode() {
      return this.isVerticalSplitMode || this.isHorizontalSplitMode;
    },
    isVerticalSplitMode() {
      return this.areas.splitVerticalMode;
    },
    isHorizontalSplitMode() {
      return this.areas.splitHorizontalMode;
    },
    isDeleteMode() {
      return this.areas.deleteMode;
    },
    isSwapMode() {
      return this.areas.swapMode;
    },
    isNoMode() {
      return this.areas.noMode;
    },
    cursor() {
      if (this.isVerticalSplitMode) {
        return "var(--areas-vertical-split-cursor, col-resize)";
      } else if (this.isHorizontalSplitMode) {
        return "var(--areas-horizontal-split-cursor, row-resize)";
      } else if (this.isSwapMode && !this.dragging) {
        return "var(--areas-drag-cursor, grab)";
      } else if (this.isSwapMode && this.dragging) {
        return "var(--areas-dragging-cursor, grabbing)";
      } else if (this.isDeleteMode) {
        return "var(--areas-delete-cursor, crosshair)";
      }
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
  background-color: var(--areas-background-color, whitesmoke);
  position: relative;
  width: 100%;
  height: 100%;
}
.area-active {
  box-shadow: inset 0 0 2px grey;
}
.area-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: var(--areas-overlay-color, rgba(128, 128, 128, 0.2));
  outline-offset: var(--areas-overlay-outline-offset, unset);
  outline: var(--areas-overlay-outline, unset);
}
.area-overlay-split {
  background-color: var(--areas-overlay-split-color, transparent);
  outline-offset: var(--areas-overlay-split-outline-offset, unset);
  outline: var(--areas-overlay-split-outline, unset);
}
.area-overlay-swap {
  background-color: var(--areas-overlay-swap-color, transparent);
  outline-offset: var(--areas-overlay-swap-outline-offset, unset);
  outline: var(--areas-overlay-swap-outline, unset);
}
.area-overlay-dragover {
  background-color: var(--areas-overlay-swapover-color, rgba(0, 100, 0, 0.1));
  outline-offset: var(--areas-overlay-swapover-outline-offset, -10px);
  outline: var(
    --areas-overlay-swapover-outline,
    5px dashed rgba(0, 100, 0, 0.2)
  );
}
.area-overlay-delete {
  background-color: var(--areas-overlay-delete-color, rgba(255, 0, 0, 0.1));
  outline-offset: var(--areas-overlay-delete-outline-offset, -7px);
  outline: var(--areas-overlay-delete-outline, 3px dashed rgba(255, 0, 0, 0.2));
}
.area-split {
  pointer-events: none;
  position: absolute;
  background-color: var(--areas-split-line-color, white);
}
.area-split-vertical {
  width: 2px;
  height: 100%;
}
.area-split-horizontal {
  width: 100%;
  height: 2px;
}
.area-content {
  overflow: scroll;
  width: 100%;
  height: 100%;
}
</style>
