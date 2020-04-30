<template>
  <div
    class="window"
    @click.right="onRighClick"
    @click="onWindowClick"
    :draggable="draggable"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @dragenter="onDragEnter"
    @drag="onDrag"
    @drop="onDrop"
    @dragend="onDragEnd"
  >
    <div :id="windowManager.getDOMWindowId(id)"></div>
  </div>
</template>

<script>
export default {
  name: "window",
  props: {
    id: { type: Number, require: true },
    draggable: { type: Boolean, default: true }
  },
  inject: ["windowManager"],
  created() {
    this.$emit("created", this);
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
      if (e.altKey) {
        this.windowManager.splitWindow(this.id, "vertical", e);
      } else if (e.shiftKey) {
        this.windowManager.splitWindow(this.id, "horizontal", e);
      }
    },
    onRighClick(e) {
      e.preventDefault();
      this.windowManager.deleteWindow(this.id, e);
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
}
</style>
