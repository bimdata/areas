<template>
  <div
    class="window"
    :class="{'window-active': isWindowActive}"
    @click.right="onRighClick"
    @click="onWindowClick"
    :draggable="draggable"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @dragenter="onDragEnter"
    @drag="onDrag"
    @drop="onDrop"
    @dragend="onDragEnd"
    @mouseenter="onMouseEnter"
    @mousemove="onMouseMove"
  >
    <div class="window-overlay" v-if="isOverlayDisplayed"></div>
    <div
      class="window-vertical-split"
      :style="{left: `${verticalSplitLeft}px`}"
      v-if="!isOverlayDisplayed"
    ></div>
    <div
      class="window-horizontal-split"
      :style="{top: `${horizontalSplitTop}px`}"
      v-if="!isOverlayDisplayed"
    ></div>
    <div :id="windowManager.getDOMWindowId(id)"></div>
  </div>
</template>

<script>
export default {
  name: "window",
  data() {
    return {
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
      return !this.isWindowActive;
    }
  },
  methods: {
    onDrag() {
      this.windowManager.draggingWindowId = this.id;
    },
    onDragEnd() {
      this.windowManager.draggingWindowId = null;
    },
    onDrop() {
      if (this.windowManager.draggingWindowId) {
        this.windowManager.swapWindows(
          this.windowManager.draggingWindowId,
          this.id
        );
      }
    },
    onDragEnter(e) {
      // console.log("dragenter");
      document.body.style.setProperty("cursor", "add", "important");
    },
    onDragOver(e) {
      e.preventDefault();
      // console.log("draghover");
    },
    onDragLeave(e) {
      // console.log("dragleave");
    },
    onWindowClick(e) {
      // this.windowManager.setActiveWindowId(this.id);
      if (e.altKey) {
        this.windowManager.splitWindow(this.id, "vertical", e);
      } else if (e.shiftKey) {
        this.windowManager.splitWindow(this.id, "horizontal", e);
      }
    },
    onRighClick(e) {
      e.preventDefault();
      this.windowManager.deleteWindow(this.id, e);
    },
    onMouseMove(e) {
      const { top, left } = this.getLocalMouseCoordinates(e);

      this.verticalSplitLeft = left;
      this.horizontalSplitTop = top;
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
  overflow: hidden;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  position: relative;
}
.window-active {
  /* border: rgba(255, 0, 0, 0.253) solid 2px; */
}
.window-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(128, 128, 128, 0.199);
}
.window-vertical-split {
  position: absolute;
  width: 3px;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
}
.window-horizontal-split {
  position: absolute;
  width: 100%;
  height: 3px;
  background-color: rgba(255, 255, 255, 0.8);
}
</style>
