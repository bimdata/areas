const AREA_SELECTOR = "[data-test=area]";
const SEPARATOR_SELECTOR = "[data-test=separator]";
const ID_PREFIX = "area-";
const WIDTH = 800;
const HEIGHT = 600;
const MARGIN_OF_ERROR = 2; // Because ratio are percentage computed to px... not perfect
const DEFAULT_COMPONENT_TEXT = "default component";
const SEPARATOR_THICKNESS = 2;

function initTest(cy, cfg) {
  cy.visit('test');
  cy.window().then(win => win.mountApp({ cfg, width: WIDTH, height: HEIGHT }))
    .then(app => app.$refs.areas).as("areas");
}

describe('Simple area', () => {
  beforeEach(() => {
    const cfg = {
      defaultComponent: { render: h => h("div", DEFAULT_COMPONENT_TEXT) },
      separatorThickness: SEPARATOR_THICKNESS,
      components: [
        { render(h) { return h("div", "component content 1") } },
        { render(h) { return h("div", "component content 2") } }
      ],
      layout: {
        componentIndex: 0
      }
    };
    initTest(cy, cfg);
  });

  it('Should render the simple area within all available space', () => {
    cy.get(AREA_SELECTOR).contains("component content 1");
    cy.get(AREA_SELECTOR).find(`#${ID_PREFIX}1`).should('have.length', 1).invoke("innerWidth").should("equal", WIDTH);
    cy.get(AREA_SELECTOR).find(`#${ID_PREFIX}1`).should('have.length', 1).invoke("innerHeight").should("equal", HEIGHT);
  });

  it('Should throw an error if trying to delete the root area', () => {
    cy.get("@areas").then(areas => {
      cy.spy(areas, "deleteArea");
      try {
        areas.deleteArea(1);
      } catch {
      } finally {
        expect(areas.deleteArea).to.have.throw();
      }
    });
  });

  it('Should add vertical area if splitted vertically, horizontal if splitted horizontally', () => {
    cy.get("@areas").invoke("splitArea", 1, "vertical", 20);

    cy.get(AREA_SELECTOR).contains("component content 1");
    cy.get(AREA_SELECTOR).should("have.length", 2).contains(DEFAULT_COMPONENT_TEXT);

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);

      // SEPARATOR_THICKNESS only for width because container is in row
      const area1TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 20 / 100;
      const area2TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 80 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
    });

    cy.get("@areas").invoke("splitArea", 1, "horizontal", 62);

    cy.get(AREA_SELECTOR).contains("component content 1");
    cy.get(`${AREA_SELECTOR}:contains(${DEFAULT_COMPONENT_TEXT})`).should('have.length', 2);

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(3);
      const [area1, area3, area2] = els;

      expect(area2.clientHeight).to.equal(HEIGHT);
      const area1TheoreticalHeight = (HEIGHT - SEPARATOR_THICKNESS) * 62 / 100;
      const area3TheoreticalHeight = (HEIGHT - SEPARATOR_THICKNESS) * 38 / 100;
      expect(area1.clientHeight).to.be.closeTo(area1TheoreticalHeight, MARGIN_OF_ERROR);
      expect(area3.clientHeight).to.be.closeTo(area3TheoreticalHeight, MARGIN_OF_ERROR);

      const area1TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 20 / 100;
      const area2TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 80 / 100;
      const area3TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 20 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area3.clientWidth).to.be.closeTo(area3TheoreticalWidth, MARGIN_OF_ERROR);
    });
  });

  it('Should display other component if area component is changed', () => {
    cy.get(AREA_SELECTOR).contains("component content 1");

    cy.get("@areas").invoke("changeAreaContent", 1, { componentIndex: 1 });

    cy.get(AREA_SELECTOR).contains("component content 2");

    cy.get("@areas").invoke("changeAreaContent", 1, { componentIndex: null });

    cy.get(AREA_SELECTOR).contains(DEFAULT_COMPONENT_TEXT);
  });

  it('Should add area if clicked in split mode', () => {
    cy.get("@areas").invoke("setMode", "split-vertical");

    cy.get(AREA_SELECTOR).trigger("click", { clientX: WIDTH / 4, clientY: HEIGHT / 2 });

    cy.get(AREA_SELECTOR).contains(DEFAULT_COMPONENT_TEXT);
    cy.get(AREA_SELECTOR).contains("component content 1");

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);

      // SEPARATOR_THICKNESS only for width because container is in row
      const area1TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 25 / 100;
      const area2TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 75 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
    });

    cy.get("@areas").invoke("setMode", "split-horizontal");

    cy.get(AREA_SELECTOR).last().trigger("click", { clientX: WIDTH / 2, clientY: HEIGHT * 0.7 });

    cy.get(AREA_SELECTOR).contains("component content 1");
    cy.get(`${AREA_SELECTOR}:contains(${DEFAULT_COMPONENT_TEXT})`).should('have.length', 2);

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(3);
      const [area1, area2, area3] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      const area2TheoreticalHeight = (HEIGHT - SEPARATOR_THICKNESS) * 70 / 100;
      const area3TheoreticalHeight = (HEIGHT - SEPARATOR_THICKNESS) * 30 / 100;
      expect(area2.clientHeight).to.be.closeTo(area2TheoreticalHeight, MARGIN_OF_ERROR);
      expect(area3.clientHeight).to.be.closeTo(area3TheoreticalHeight, MARGIN_OF_ERROR);

      const area1TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 25 / 100;
      const area2TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 75 / 100;
      const area3TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 75 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area3.clientWidth).to.be.closeTo(area3TheoreticalWidth, MARGIN_OF_ERROR);
    });
  });
});

describe('Default component', () => {
  beforeEach(() => {
    const cfg = {
      separatorThickness: SEPARATOR_THICKNESS,
      layout: {
        componentIndex: null
      }
    };
    initTest(cy, cfg);
  });

  it('Should display the default component if componentIndex = null', () => {
    cy.get(AREA_SELECTOR).find(`#${ID_PREFIX}1`).should(el => {
      expect(el).to.have.length(1);
      expect(el[0].clientWidth).to.equal(WIDTH);
      expect(el[0].clientHeight).to.equal(HEIGHT);
    });
  });
});

describe('Custom default component', () => {
  beforeEach(() => {
    const cfg = {
      separatorThickness: SEPARATOR_THICKNESS,
      defaultComponent: {
        props: { text: { type: String } },
        render(h) { return h("div", this.text) }
      },
      layout: {
        componentIndex: null,
        cfg: {
          props: {
            text: "CUSTOM DEFAULT COMPONENT"
          }
        }
      }
    };
    initTest(cy, cfg);
  });

  it('Should display the custom default component if componentIndex = null and cfg should work', () => {
    cy.get(AREA_SELECTOR).contains("CUSTOM DEFAULT COMPONENT");
    cy.get(AREA_SELECTOR).find(`#${ID_PREFIX}1`).should(el => {
      expect(el).to.have.length(1);
      expect(el[0].clientWidth).to.equal(WIDTH);
      expect(el[0].clientHeight).to.equal(HEIGHT);
    });
  });
});

describe('Dual vertical areas', () => {
  const toSpy = {
    handler: () => { }
  }
  const comp1 = {
    inject: ["$area"],
    created() {
      this.$area.onChange(this.handler);
    },
    methods: {
      handler(id, old) {
        toSpy.handler(id, old);
      },
    },
    render(h) {
      return h("div", "component content 1")
    }
  }

  beforeEach(() => {
    const cfg = {
      defaultComponent: { render: h => h("div", DEFAULT_COMPONENT_TEXT) },
      separatorThickness: SEPARATOR_THICKNESS,
      components: [
        comp1,
        { render(h) { return h("div", "component content 2") } }
      ],
      layout: {
        ratios: [30, 70],
        children: [
          {
            componentIndex: 0
          },
          {
            componentIndex: 1
          }
        ]
      }
    };
    initTest(cy, cfg);
  });

  it('Should render the two areas with the correct width and height', () => {
    cy.get(AREA_SELECTOR).contains("component content 1");
    cy.get(AREA_SELECTOR).contains("component content 2");

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);

      // SEPARATOR_THICKNESS only for width because container is in row
      const area1TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 30 / 100;
      const area2TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 70 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
    });
  });

  it('Should update areas width when dragging the separator horizontally', () => {
    cy.get(SEPARATOR_SELECTOR)
      .trigger('mousedown', "center")
      .trigger("mousemove", { clientX: WIDTH / 10 })
      .trigger('mouseup');

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);

      const area1TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 10 / 100;
      const area2TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 90 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
    });
  });

  it('Should call onChange $area with correct ids method when swapping areas', () => {
    cy.spy(toSpy, "handler");
    cy.get(`#${ID_PREFIX}1`).contains("component content 1");
    cy.get(`#${ID_PREFIX}2`).contains("component content 2");
    cy.get("@areas").invoke("swapAreas", 1, 2);
    cy.get(`#${ID_PREFIX}1`).contains("component content 2");
    cy.get(`#${ID_PREFIX}2`).contains("component content 1");

    cy.wrap(toSpy).its("handler").should("be.calledWith", 2, 1);

    cy.get("@areas").invoke("swapAreas", 1, 2);

    cy.wrap(toSpy).its("handler").should("be.calledWith", 1, 2);

    cy.get(`#${ID_PREFIX}1`).contains("component content 1");
    cy.get(`#${ID_PREFIX}2`).contains("component content 2");
  });
});

describe('Dual horizontal areas', () => {
  beforeEach(() => {
    const cfg = {
      defaultComponent: { render: h => h("div", DEFAULT_COMPONENT_TEXT) },
      separatorThickness: SEPARATOR_THICKNESS,
      components: [
        {
          render(h) {
            return h("div", "component content 1")
          }
        },
        { render(h) { return h("div", "component content 2") } }
      ],
      layout: {
        ratios: [16, 84],
        direction: "column",
        children: [
          {
            componentIndex: 0
          },
          {
            componentIndex: 1
          }
        ]
      }
    };
    initTest(cy, cfg);
  });

  it('Should render the two areas with the correct width and height', () => {
    cy.get(AREA_SELECTOR).contains("component content 1");
    cy.get(AREA_SELECTOR).contains("component content 2");

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientWidth).to.equal(WIDTH);
      expect(area2.clientWidth).to.equal(WIDTH);

      // SEPARATOR_THICKNESS only for height because container is in column
      const area1TheoreticalHeight = (HEIGHT - SEPARATOR_THICKNESS) * 16 / 100;
      const area2TheoreticalHeight = (HEIGHT - SEPARATOR_THICKNESS) * 84 / 100;
      expect(area1.clientHeight).to.be.closeTo(area1TheoreticalHeight, MARGIN_OF_ERROR);
      expect(area2.clientHeight).to.be.closeTo(area2TheoreticalHeight, MARGIN_OF_ERROR);
    });
  });

  it('Should update areas height when dragging the separator vertically', () => {
    cy.get(SEPARATOR_SELECTOR)
      .trigger('mousedown', "center")
      .trigger("mousemove", { clientY: HEIGHT / 2 })
      .trigger('mouseup');

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientWidth).to.equal(WIDTH);
      expect(area2.clientWidth).to.equal(WIDTH);

      const area1TheoreticalHeight = (HEIGHT - SEPARATOR_THICKNESS) * 50 / 100;
      const area2TheoreticalHeight = (HEIGHT - SEPARATOR_THICKNESS) * 50 / 100;
      expect(area1.clientHeight).to.be.closeTo(area1TheoreticalHeight, MARGIN_OF_ERROR);
      expect(area2.clientHeight).to.be.closeTo(area2TheoreticalHeight, MARGIN_OF_ERROR);
    });
  });

});

describe('Three areas in the same direction (vertical)', () => {
  beforeEach(() => {
    const cfg = {
      defaultComponent: { render: h => h("div", DEFAULT_COMPONENT_TEXT) },
      separatorThickness: SEPARATOR_THICKNESS,
      separatorDetectionMargin: 0, // To handle mouseup correctly on separator
      components: [
        {
          render(h) {
            return h("div", "component content 1")
          }
        },
        { render(h) { return h("div", "component content 2") } },
        { render(h) { return h("div", "component content 3") } }
      ],
      layout: {
        ratios: [30, 30, 40],
        direction: "row",
        children: [
          {
            componentIndex: 0
          },
          {
            componentIndex: 1
          },
          {
            componentIndex: 2
          }
        ]
      }
    };
    initTest(cy, cfg);
  });

  it('Should render the three areas with the correct width and height', () => {
    cy.get(AREA_SELECTOR).contains("component content 1");
    cy.get(AREA_SELECTOR).contains("component content 2");
    cy.get(AREA_SELECTOR).contains("component content 3");

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(3);
      const [area1, area2, area3] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);
      expect(area3.clientHeight).to.equal(HEIGHT);

      const area1TheoreticalWidth = (WIDTH - 2 * SEPARATOR_THICKNESS) * 30 / 100;
      const area2TheoreticalWidth = (WIDTH - 2 * SEPARATOR_THICKNESS) * 30 / 100;
      const area3TheoreticalWidth = (WIDTH - 2 * SEPARATOR_THICKNESS) * 40 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area3.clientWidth).to.be.closeTo(area3TheoreticalWidth, MARGIN_OF_ERROR);
    });
  });

  it('Should only update ratios of related areas when moving a separator', () => {
    cy.get(SEPARATOR_SELECTOR)
      .first()
      .trigger('mousedown', "center")
      .trigger("mousemove", { clientX: WIDTH / 2 })
      .trigger('mouseup');

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(3);
      const [area1, area2, area3] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);
      expect(area3.clientHeight).to.equal(HEIGHT);

      const area1TheoreticalWidth = (WIDTH - 2 * SEPARATOR_THICKNESS) * 50 / 100;
      const area2TheoreticalWidth = (WIDTH - 2 * SEPARATOR_THICKNESS) * 10 / 100;
      const area3TheoreticalWidth = (WIDTH - 2 * SEPARATOR_THICKNESS) * 40 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area3.clientWidth).to.be.closeTo(area3TheoreticalWidth, MARGIN_OF_ERROR);
    });
  });

  it('Should not move separator away from another separator', () => {
    cy.get(SEPARATOR_SELECTOR).first()
      .trigger('mousedown', "center")
      .trigger("mousemove", { clientX: WIDTH })
      .trigger('mouseup');

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(3);
      const [area1, area2, area3] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);
      expect(area3.clientHeight).to.equal(HEIGHT);

      const area1TheoreticalWidth = (WIDTH - 2 * SEPARATOR_THICKNESS) * 60 / 100;
      const area2TheoreticalWidth = 0;
      const area3TheoreticalWidth = (WIDTH - 2 * SEPARATOR_THICKNESS) * 40 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area3.clientWidth).to.be.closeTo(area3TheoreticalWidth, MARGIN_OF_ERROR);
    });
  });

  it("Should fill the space and display the correct areas when deleting area", () => {

    cy.get(AREA_SELECTOR).contains("component content 1");
    cy.get(AREA_SELECTOR).contains("component content 2");
    cy.get(AREA_SELECTOR).contains("component content 3");

    cy.get("@areas").invoke("deleteArea", 2);

    cy.get(AREA_SELECTOR).contains("component content 1");
    cy.get(AREA_SELECTOR).contains("component content 2").should("not.exist");
    cy.get(AREA_SELECTOR).contains("component content 3");

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);

      const area1TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 60 / 100;
      const area2TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 40 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
    });

    cy.get("@areas").invoke("deleteArea", 1);

    cy.get(AREA_SELECTOR).contains("component content 1").should("not.exist");
    cy.get(AREA_SELECTOR).contains("component content 2").should("not.exist");
    cy.get(AREA_SELECTOR).contains("component content 3");

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(1);
      const [area2] = els;

      expect(area2.clientHeight).to.equal(HEIGHT);
      expect(area2.clientWidth).to.equal(WIDTH);
    });

  });

  it("Should delete area if clicked in delete mode", () => {
    cy.get("@areas").invoke("setMode", "delete");

    cy.get(AREA_SELECTOR).contains("component content 1");
    cy.get(AREA_SELECTOR).contains("component content 2");
    cy.get(AREA_SELECTOR).contains("component content 3");

    cy.get(AREA_SELECTOR).eq(1).trigger("click", { clientX: WIDTH / 2, clientY: HEIGHT / 2 });

    cy.get(AREA_SELECTOR).contains("component content 1");
    cy.get(AREA_SELECTOR).contains("component content 2").should("not.exist");
    cy.get(AREA_SELECTOR).contains("component content 3");

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);

      const area1TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 60 / 100;
      const area2TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 40 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
    });

    cy.get(AREA_SELECTOR).first().trigger("click", { clientX: WIDTH / 4, clientY: HEIGHT / 2 });

    cy.get(AREA_SELECTOR).contains("component content 1").should("not.exist");
    cy.get(AREA_SELECTOR).contains("component content 2").should("not.exist");
    cy.get(AREA_SELECTOR).contains("component content 3");

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(1);
      const [area2] = els;

      expect(area2.clientHeight).to.equal(HEIGHT);
      expect(area2.clientWidth).to.equal(WIDTH);
    });
  })
});

describe('Three areas in a custom layout (a big left, two at the right, little at the top, big at the bottom)', () => {
  beforeEach(() => {
    const cfg = {
      defaultComponent: { render: h => h("div", DEFAULT_COMPONENT_TEXT) },
      separatorThickness: SEPARATOR_THICKNESS,
      components: [
        {
          render(h) {
            return h("div", "component content 1")
          }
        },
        { render(h) { return h("div", "component content 2") } },
        { render(h) { return h("div", "component content 3") } }
      ],
      layout: {
        ratios: [20, 80],
        direction: "row",
        children: [
          {
            componentIndex: 1
          },
          {
            ratios: [15, 85],
            direction: "column",
            children: [
              {
                componentIndex: 2
              },
              {
                componentIndex: 0
              },
            ]
          }
        ]
      }
    };
    initTest(cy, cfg);
  });

  it('Should render the three areas with the correct width and height', () => {
    cy.get(AREA_SELECTOR).contains("component content 1");
    cy.get(AREA_SELECTOR).contains("component content 2");
    cy.get(AREA_SELECTOR).contains("component content 3");

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(3);
      const [area1, area2, area3] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      const area2TheoreticalHeight = (HEIGHT - SEPARATOR_THICKNESS) * 15 / 100;
      const area3TheoreticalHeight = (HEIGHT - SEPARATOR_THICKNESS) * 85 / 100;
      expect(area2.clientHeight).to.be.closeTo(area2TheoreticalHeight, MARGIN_OF_ERROR);
      expect(area3.clientHeight).to.be.closeTo(area3TheoreticalHeight, MARGIN_OF_ERROR);

      const area1TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 20 / 100;
      const area2TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 80 / 100;
      const area3TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 80 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area3.clientWidth).to.be.closeTo(area3TheoreticalWidth, MARGIN_OF_ERROR);
    });
  });

  it('Should only update ratios of related areas when moving a separator', () => {
    cy.get(SEPARATOR_SELECTOR).first()
      .trigger('mousedown', "center")
      .trigger("mousemove", { clientX: WIDTH / 2 })
      .trigger('mouseup');

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(3);
      const [area1, area2, area3] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      const area2TheoreticalHeight = (HEIGHT - SEPARATOR_THICKNESS) * 15 / 100;
      const area3TheoreticalHeight = (HEIGHT - SEPARATOR_THICKNESS) * 85 / 100;
      expect(area2.clientHeight).to.be.closeTo(area2TheoreticalHeight, MARGIN_OF_ERROR);
      expect(area3.clientHeight).to.be.closeTo(area3TheoreticalHeight, MARGIN_OF_ERROR);

      const area1TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 50 / 100;
      const area2TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 50 / 100;
      const area3TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 50 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area3.clientWidth).to.be.closeTo(area3TheoreticalWidth, MARGIN_OF_ERROR);
    });

    cy.get(SEPARATOR_SELECTOR).last()
      .trigger('mousedown', "center")
      .trigger("mousemove", { clientY: HEIGHT * 0.78 });

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(3);
      const [area1, area2, area3] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      const area2TheoreticalHeight = (HEIGHT - SEPARATOR_THICKNESS) * 78 / 100;
      const area3TheoreticalHeight = (HEIGHT - SEPARATOR_THICKNESS) * 22 / 100;
      expect(area2.clientHeight).to.be.closeTo(area2TheoreticalHeight, MARGIN_OF_ERROR);
      expect(area3.clientHeight).to.be.closeTo(area3TheoreticalHeight, MARGIN_OF_ERROR);

      const area1TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 50 / 100;
      const area2TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 50 / 100;
      const area3TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 50 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area3.clientWidth).to.be.closeTo(area3TheoreticalWidth, MARGIN_OF_ERROR);
    });
  });

  it("Should fill the space and display the correct areas when deleting area", () => {
    cy.get(AREA_SELECTOR).contains("component content 2");
    cy.get(AREA_SELECTOR).contains("component content 3");
    cy.get(AREA_SELECTOR).contains("component content 1");

    cy.get("@areas").invoke("deleteArea", 3);

    cy.get(AREA_SELECTOR).contains("component content 2");
    cy.get(AREA_SELECTOR).contains("component content 3");
    cy.get(AREA_SELECTOR).contains("component content 1").should('not.exist');

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);

      const area1TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 20 / 100;
      const area2TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 80 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
    });

    cy.get("@areas").invoke("deleteArea", 1);

    cy.get(AREA_SELECTOR).contains("component content 2").should('not.exist');
    cy.get(AREA_SELECTOR).contains("component content 3");
    cy.get(AREA_SELECTOR).contains("component content 1").should('not.exist');

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(1);
      const [area2] = els;

      expect(area2.clientHeight).to.equal(HEIGHT);
      expect(area2.clientWidth).to.equal(WIDTH);
    });

  });

  it('Should display the correct content after swapping areas content', () => {
    cy.get(`#${ID_PREFIX}1`).contains("component content 2");
    cy.get(`#${ID_PREFIX}2`).contains("component content 3");
    cy.get(`#${ID_PREFIX}3`).contains("component content 1");
    cy.get("@areas").invoke("swapAreas", 1, 2);
    cy.get(`#${ID_PREFIX}1`).contains("component content 3");
    cy.get(`#${ID_PREFIX}2`).contains("component content 2");
    cy.get(`#${ID_PREFIX}3`).contains("component content 1");
    cy.get("@areas").invoke("swapAreas", 1, 3);
    cy.get(`#${ID_PREFIX}1`).contains("component content 1");
    cy.get(`#${ID_PREFIX}2`).contains("component content 2");
    cy.get(`#${ID_PREFIX}3`).contains("component content 3");
  });

  it.skip('Should display the correct content after drag and drop areas in swap mode', () => {
    // TODO skipped because Cypress drag & drop no seems to work properly
    cy.get("@areas").invoke("setMode", "swap");

    cy.get(`#${ID_PREFIX}1`).contains("component content 2");
    cy.get(`#${ID_PREFIX}2`).contains("component content 3");
    cy.get(`#${ID_PREFIX}3`).contains("component content 1");

    cy.get(AREA_SELECTOR).first()
      .trigger("mousedown", { which: 1 })
    cy.get(AREA_SELECTOR).last()
      .trigger("mousemove")
      .trigger("mouseup", { force: true });

    cy.get(`#${ID_PREFIX}1`).contains("component content 1");
    cy.get(`#${ID_PREFIX}2`).contains("component content 3");
    cy.get(`#${ID_PREFIX}3`).contains("component content 2");
  });

  it("Should save and load layout", () => {
    cy.get("@areas").then(areas => areas.getCurrentLayout()).as('savedLayout');

    cy.get(SEPARATOR_SELECTOR)
      .first()
      .trigger('mousedown', "center")
      .trigger("mousemove", { clientX: WIDTH / 2 })
      .trigger('mouseup');

    cy.get("@areas").invoke("deleteArea", 3);

    cy.get("@areas")
      .then(areas => cy.get("@savedLayout").then(savedLayout => areas.loadLayout(savedLayout)));

    cy.get(`#${ID_PREFIX}1`).contains("component content 2");
    cy.get(`#${ID_PREFIX}2`).contains("component content 3");
    cy.get(`#${ID_PREFIX}3`).contains("component content 1");

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(3);
      const [area1, area2, area3] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      const area2TheoreticalHeight = (HEIGHT - SEPARATOR_THICKNESS) * 15 / 100;
      const area3TheoreticalHeight = (HEIGHT - SEPARATOR_THICKNESS) * 85 / 100;
      expect(area2.clientHeight).to.be.closeTo(area2TheoreticalHeight, MARGIN_OF_ERROR);
      expect(area3.clientHeight).to.be.closeTo(area3TheoreticalHeight, MARGIN_OF_ERROR);

      const area1TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 20 / 100;
      const area2TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 80 / 100;
      const area3TheoreticalWidth = (WIDTH - SEPARATOR_THICKNESS) * 80 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area3.clientWidth).to.be.closeTo(area3TheoreticalWidth, MARGIN_OF_ERROR);
    });
  });
});

describe('Components must be created only once and cached', () => {

  const comp1 = { created() { /* default */ }, render(h) { return h("div", "component content 1") } };
  const comp2 = { created() { /* default */ }, render(h) { return h("div", "component content 2") } };
  const comp3 = { created() { /* default */ }, render(h) { return h("div", "component content 3") } };

  beforeEach(() => {
    cy.spy(comp1, "created");
    cy.spy(comp2, "created");
    cy.spy(comp3, "created");

    const cfg = {
      defaultComponent: { render: h => h("div", DEFAULT_COMPONENT_TEXT) },
      separatorThickness: SEPARATOR_THICKNESS,
      separatorDetectionMargin: 0,
      components: [
        comp1,
        comp2,
        comp3
      ],
      layout: {
        ratios: [20, 80],
        direction: "row",
        children: [
          {
            componentIndex: 1
          },
          {
            ratios: [15, 85],
            direction: "column",
            children: [
              {
                componentIndex: 2
              },
              {
                componentIndex: 0
              },
            ]
          }
        ]
      }
    };
    initTest(cy, cfg);
  });

  it("Created method must have been called only once after resize, split, change, swap and delete", () => {
    cy.get(SEPARATOR_SELECTOR).last()
      .trigger('mousedown', "center")
      .trigger("mousemove", { clientY: HEIGHT / 2 })
      .trigger('mouseup');
    cy.get("@areas").invoke("splitArea", 1, "vertical", 20);
    cy.get("@areas").invoke("changeAreaContent", 1, { componentIndex: null });
    cy.get("@areas").invoke("swapAreas", 1, 2);
    cy.get("@areas").invoke("deleteArea", 2);

    cy.wrap(comp1).its("created").should("be.calledOnce");
    cy.wrap(comp2).its("created").should("be.calledOnce");
    cy.wrap(comp3).its("created").should("be.calledOnce");
  });
});