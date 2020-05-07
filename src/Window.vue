<template>
  <div
    class="window"
    :class="{
      'window-active': isWindowActive,
      'window-active-vertical-splitting': windowManager.splitMode === 'vertical',
      'window-active-horizontal-splitting': windowManager.splitMode === 'horizontal',
      'window-active-grab': windowManager.dragAndDropMode && !dragging,
      'window-active-grabbing': dragging,
      }"
    @click.right="onRighClick"
    @click="onWindowClick"
    :draggable="draggable"
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
    <div class="window-overlay" v-if="isOverlayDisplayed"></div>
    <div class="window-overlay-dragover" v-if="dragover && !dragging">
      <div class="dash-area"></div>
    </div>
    <div
      class="window-vertical-split"
      :style="{left: `${verticalSplitLeft}%`}"
      v-if="verticalSplitDisplayed"
    ></div>
    <div
      class="window-horizontal-split"
      :style="{top: `${horizontalSplitTop}%`}"
      v-if="horizontalSplitDisplayed"
    ></div>
    <div class="window-content" :id="windowManager.getDOMWindowId(id)"></div>
  </div>
</template>

<script>
export default {
  name: "window",
  data() {
    return {
      dragover: false,
      dragging: false,
      verticalSplitLeft: null,
      horizontalSplitTop: null
    };
  },
  props: {
    id: { type: Number, require: true },
    draggable: { type: Boolean, default: true }
  },
  inject: ["windowManager"],
  created() {
    this.$emit("created", this);
  },
  computed: {
    isWindowActive() {
      return this.id === this.windowManager.activeWindowId;
    },
    isOverlayDisplayed() {
      return (
        !this.isWindowActive &&
        (this.windowManager.splitMode || this.windowManager.dragAndDropMode)
      );
    },
    verticalSplitDisplayed() {
      return (
        this.isWindowActive &&
        this.isVerticalSplitMode &&
        this.verticalSplitLeft !== null
      );
    },
    horizontalSplitDisplayed() {
      return (
        this.isWindowActive &&
        this.isHorizontalSplitMode &&
        this.horizontalSplitTop !== null
      );
    },
    isVerticalSplitMode() {
      return this.windowManager.splitMode === "vertical";
    },
    isHorizontalSplitMode() {
      return this.windowManager.splitMode === "horizontal";
    }
  },
  methods: {
    onDragStart(dragEvent) {
      this.dragging = true;
      dragEvent.dataTransfer.setData("windowmanager-windowid", String(this.id));
      dragEvent.dataTransfer.effectAllowed = "move";
    },
    onDragEnd() {
      this.dragging = false;
    },
    onDrop(dragEvent) {
      this.dragover = false;
      const windowId = parseInt(
        dragEvent.dataTransfer.getData("windowmanager-windowid"),
        10
      );
      this.windowManager.swapWindows(windowId, this.id);
    },
    onDragEnter(dragEvent) {
      if (dragEvent.dataTransfer.types.includes("windowmanager-windowid")) {
        this.dragover = true;
      }
    },
    onDragOver(dragEvent) {
      if (dragEvent.dataTransfer.types.includes("windowmanager-windowid")) {
        dragEvent.preventDefault();
        dragEvent.dataTransfer.dropEffect = "move";
      }
    },
    onDragLeave(e) {
      this.dragover = false;
    },
    onWindowClick(e) {
      const {
        horizontalPercentage,
        verticalPercentage
      } = this.getLocalMouseCoordinates(e);
      if (e.altKey) {
        this.windowManager.splitWindow(this.id, "vertical", verticalPercentage);
      } else if (e.shiftKey) {
        this.windowManager.splitWindow(
          this.id,
          "horizontal",
          horizontalPercentage
        );
      }
    },
    onRighClick(e) {
      e.preventDefault();
      this.windowManager.deleteWindow(this.id, e);
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
      if (!this.isWindowActive) {
        this.windowManager.setActiveWindowId(this.id);
      }
    }
  }
};
</script>

<style scoped>
.window {
  background-color: cornsilk;
  box-sizing: border-box;
  position: relative;
  width: 100%;
  height: 100%;
}
.window-active {
  box-shadow: inset 0 0 5px grey;
}
.window-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(128, 128, 128, 0.199);
}
.window-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(128, 128, 128, 0.199);
}
.window-overlay-dragover {
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
.window-vertical-split {
  pointer-events: none;
  position: absolute;
  margin-left: -1px;
  width: 3px;
  height: 100%;
  background-color: red;
}
.window-horizontal-split {
  pointer-events: none;
  position: absolute;
  margin-top: -1px;
  width: 100%;
  height: 3px;
  background-color: red;
}
.window-active-vertical-splitting {
  cursor: col-resize;
}
.window-active-horizontal-splitting {
  cursor: row-resize;
}
.window-active-grab {
  cursor: grab;
}
.window-active-grabbing {
  cursor: grabbing;
}
.window-content {
  overflow: scroll;
  width: 100%;
  height: 100%;
}
</style>
