<template>
  <div class="teleport">
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    target: {
      type: String,
      require: true
    }
  },
  mounted() {
    this.child = this.$el.firstChild;
    this.$watch(
      "target",
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
      const targetElement = document.getElementById(this.target);
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