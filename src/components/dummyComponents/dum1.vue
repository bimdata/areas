<template>
  <div class="dum1">Coucou</div>
</template>

<script>
export default {
  name: "dum1",
  // inject: ["$context"],
  created() {
    console.log("dum1 created");
  },
  mounted() {
    console.log("dum1 mounted");
  },
  destroyed() {
    console.log("dum1 destroyed");
  }
};
</script>