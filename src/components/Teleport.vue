<template>
  <div class="teleport">
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    targetId: {
      type: Number,
      require: true
    }
  },
  inject: ["windowManager"],
  provide() {
    const self = this;
    return {
      $context: {
        get window() {
          return self.windowManager.getWindow(self.targetId);
        }
      }
    };
  },
  mounted() {
    this.child = this.$el.firstChild;
    this.$watch(
      "targetId",
      () => {
        this.attach(true);
      },
      {
        immediate: true
      }
    );
  },
  methods: {
    attach(removeFromCurentParent = false) {
      const targetElement = document.getElementById(
        this.windowManager.getDOMWindowId(this.targetId)
      );
      if (!targetElement) {
        throw `Teleport fails, no DOM element with id : "${this.target}"`;
      }
      if (removeFromCurentParent && this.$el.contains(this.child)) {
        this.$el.removeChild(this.child);
      }
      if (!targetElement.contains(this.child)) {
        targetElement.appendChild(this.child);
      }
    }
  }
};
</script>