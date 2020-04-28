export default {
  created() {
    console.log(`${this.$options.name} created`);
  },
  mounted() {
    console.log(`${this.$options.name} mounted`);
  },
  destroyed() {
    console.log(`${this.$options.name} destroyed`);
  }
}