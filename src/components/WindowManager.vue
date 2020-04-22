<template>
  <div class="window-manager">
    <WindowContainer>
      <Window>Coucou</Window>
      <Window>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Repudiandae maiores placeat magni, ipsa debitis quaerat assumenda inventore cumque culpa, quisquam libero sed nobis esse! Neque id explicabo voluptatem repellat dolorum!</Window>
      <WindowContainer direction="column">
        <Window>
          <img
            src="https://media-exp1.licdn.com/dms/image/C4D0BAQHoCO5FSOrIGg/company-logo_200_200/0?e=1595462400&v=beta&t=IuKqJs7fxWdhdzpGbzrYtPqJnvpFMmLJIt4a-NdVylo"
          />
        </Window>
        <Window>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Beatae ipsum iure ex praesentium, non eos, facilis sint maxime enim provident porro odit doloremque commodi odio voluptatibus alias nostrum totam accusamus?
          Lorem ipsum dolor sit amet consectetur adipisicing elit. In aspernatur quae sapiente reprehenderit aliquid ullam sit asperiores laboriosam, incidunt non molestiae hic nostrum nihil autem labore culpa beatae sunt animi.
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Sequi excepturi delectus eum eos, praesentium, distinctio corrupti quasi facere exercitationem facilis suscipit impedit? Recusandae doloribus expedita cupiditate, vel illum omnis totam.
        </Window>
      </WindowContainer>
    </WindowContainer>
  </div>
</template>

<script>
import Window from "./Window.vue";
import WindowContainer from "./WindowContainer.vue";
export default {
  name: "WindowManager",
  components: {
    Window,
    WindowContainer
  }
};
</script>

<style scoped>
.window-manager {
  background-color: darkslategrey;
  height: 100%;
  width: 100%;
  display: flex;
}
</style>
