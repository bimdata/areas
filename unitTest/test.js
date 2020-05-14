import { shallowMount } from '@vue/test-utils';
import Vue from "vue";
import Areas from "../src/Areas.vue";

const COMPONENT_TEST_1 = { render(h) { return h("div", "comp 1") } };
const COMPONENT_TEST_2 = { render(h) { return h("div", "comp 2") } };
const COMPONENT_TEST_3 = { render(h) { return h("div", "comp 3") } };

describe('Areas', () => {
  it("Should work with only one area", () => {
    const cfg = {
      components: [
        {
          props: { text: { type: String, default: "no text provided" } },
          render(h) { return h("div", this.text) }
        }
      ],
      layout: { componentIndex: 0 }
    };
    const wrapper = shallowMount(Areas, { propsData: { cfg } });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("Should display the default empty component if componentIndex = null", () => {
    const cfg = {
      layout: { componentIndex: null }
    };
    const wrapper = shallowMount(Areas, { propsData: { cfg } });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("Should work with two areas in the same direction (row)", () => {
    const cfg = {
      components: [
        COMPONENT_TEST_1,
        COMPONENT_TEST_2
      ],
      layout: {
        ratios: [80, 20],
        children: [
          { componentIndex: 0 },
          { componentIndex: 1 }
        ]
      }
    };
    const wrapper = shallowMount(Areas, { propsData: { cfg } });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("Should work with two areas in the same direction (column)", () => {
    const cfg = {
      components: [
        COMPONENT_TEST_1,
        COMPONENT_TEST_2
      ],
      layout: {
        direction: "column",
        ratios: [45, 55],
        children: [
          { componentIndex: 0 },
          { componentIndex: 1 }
        ]
      }
    };
    const wrapper = shallowMount(Areas, { propsData: { cfg } });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("Should work with three areas in a custom layout", () => {
    const cfg = {
      components: [
        COMPONENT_TEST_1,
        COMPONENT_TEST_2,
        COMPONENT_TEST_3
      ],
      layout: {
        direction: "column",
        ratios: [45, 55],
        children: [
          { componentIndex: 0 },
          {
            ratios: [5, 95],
            children: [
              { componentIndex: 1 },
              { componentIndex: 2 }
            ]
          }
        ]
      }
    };
    const wrapper = shallowMount(Areas, { propsData: { cfg } });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("Should not allow user to give more ratios than children", () => {
    const cfg = {
      components: [
        COMPONENT_TEST_1,
        COMPONENT_TEST_2,
        COMPONENT_TEST_3
      ],
      layout: {
        children: [
          { componentIndex: 0 },
          { componentIndex: 1 },
          { componentIndex: 2 },
        ],
        ratios: [25, 25, 25, 25]
      }
    };

    spyOn(console, "error"); // Remove console error due to the trow
    expect(() => shallowMount(Areas, { propsData: { cfg } })).toThrow();
  });

  it("Should not allow user to give less ratios than children", () => {
    const cfg = {
      components: [
        COMPONENT_TEST_1,
        COMPONENT_TEST_2,
        COMPONENT_TEST_3
      ],
      layout: {
        children: [
          { componentIndex: 0 },
          { componentIndex: 1 },
          { componentIndex: 2 },
        ],
        ratios: [25, 75]
      }
    };

    spyOn(console, "error"); // Remove console error due to the trow
    expect(() => shallowMount(Areas, { propsData: { cfg } })).toThrow();
  });

  it("Should not allow user to give inexisting component index", () => {
    const cfg = {
      components: [
        COMPONENT_TEST_1,
      ],
      layout: {
        children: [
          { componentIndex: 0 },
          { componentIndex: 1 }
        ],
        ratios: [25, 75]
      }
    };

    spyOn(console, "error"); // Remove console error due to the trow
    expect(() => shallowMount(Areas, { propsData: { cfg } })).toThrow();
  });

  it("Should allow user to get component by name and update props (this should be reactive)", async () => {
    const cfg = {
      components: [
        {
          props: {
            text: {
              type: String,
              required: true
            }
          },
          render(h) { return h("div", this.text) }
        },
      ],
      layout: {
        name: 'targetComponent',
        componentIndex: 0,
        cfg: {
          props: {
            text: "empty"
          }
        }
      }
    };

    const wrapper = shallowMount(Areas, { propsData: { cfg } });
    expect(wrapper.html()).toMatchSnapshot();

    wrapper.vm.getComponentByName("targetComponent").cfg.props.text = "text updated";
    await Vue.nextTick();
    expect(wrapper.html()).toMatchSnapshot();
  });
});