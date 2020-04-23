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
    this.$watch(
      "target",
      () => {
        const targetElement = document.getElementById(this.target);
        if (!targetElement) {
          throw `Teleport fails, no DOM element with id : "${this.target}"`;
        }
        const parent = this.$el.parentElement;
        parent.removeChild(this.$el);
        targetElement.appendChild(this.$el);
      },
      {
        immediate: true
      }
    );
  }
};
</script>