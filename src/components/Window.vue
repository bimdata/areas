<template>
  <div class="window" @click="onWindowClick">
    <slot />
  </div>
</template>

<script>
export default {
  name: "window",
  props: {
    id: { type: Number, require: true }
  },
  inject: ["windowManager"],
  provide() {
    return {
      $context: {
        window: this
      }
    };
  },
  created() {
    this.$emit("created", this);
  },
  methods: {
    onWindowClick() {
      console.log(`window ${this.id} clicked`); // TODO for develoment only
      this.windowManager.swapWindows(this.id, 1);
      // this.windowManager.splitWindow(this.id);
    }
  }
};
</script>

<style scoped>
.window {
  background-color: cornsilk;
  overflow: hidden;
}
</style>
