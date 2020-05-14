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
  inject: ["areas"],
  provide() {
    const self = this;
    return {
      $context: {
        get area() {
          return self.areas.getArea(self.targetId); // TODO this may not be exposed this way
        }
      }
    };
  },
  mounted() {
    this.$emit("mounted", { childInstance: this.$children[0] }); // TODO may be changed
    this.child = this.$el.firstChild;
    this.$watch(
      "targetId",
      () => {
        if (this.$el.contains(this.child)) {
          this.$el.removeChild(this.child);
        }
        this.attach(true);
      },
      {
        immediate: true
      }
    );
  },
  methods: {
    attach() {
      const targetElement = document.getElementById(
        this.areas.getDOMAreaId(this.targetId)
      );
      if (!targetElement) {
        throw `Teleport fails, no DOM element with id : "${this.targetId}".`;
      }
      while (targetElement.hasChildNodes()) {
        targetElement.removeChild(targetElement.firstChild);
      }
      if (!targetElement.contains(this.child)) {
        targetElement.appendChild(this.child);
      }
    }
  }
};
</script>
