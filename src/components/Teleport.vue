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
      if (removeFromCurentParent) {
        const parent = this.$el.parentElement;
        parent.removeChild(this.$el);
      }
      if (!targetElement.contains(this.$el)) {
        targetElement.appendChild(this.$el);
      }
    }
  }
};
</script>