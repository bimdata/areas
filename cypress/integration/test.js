const AREA_SELECTOR = "[data-test=area]";
const SEPARATOR_SELECTOR = "[data-test=separator]";
const ID_PREFIX = "window-";
const WIDTH = 800;
const HEIGHT = 600;
// TODO MARGIN_OF_ERROR may be reduced after taking into accound separator thickness
const MARGIN_OF_ERROR = 3; // Because ratio are percentage computed to px... not perfect

// TODO somae feature like swap may also be tested with mouse event instead of direct API (with drag and drop mode set for example)

function initTest(cy, cfg) {
  cy.visit('test');
  cy.window().then(win => win.mountApp({ cfg, width: WIDTH, height: HEIGHT }))
    .then(app => app.$refs.areas).as("areas");
}

describe('Simple area', () => {
  beforeEach(() => {
    const cfg = {
      components: [{ render(h) { return h("div", "Hey !") } }],
      layout: {
        componentIndex: 0
      }
    };
    initTest(cy, cfg);
  });

  it('Should render the simple area within all available space', () => {
    cy.get(AREA_SELECTOR).contains("Hey !");
    cy.get(AREA_SELECTOR).find(`#${ID_PREFIX}1`).should(el => {
      expect(el).to.have.length(1);
      expect(el[0].clientWidth).to.equal(WIDTH);
      expect(el[0].clientHeight).to.equal(HEIGHT);
    })
  });

  it('Should throw an error if trying to delete the root window', () => {
    cy.get("@areas").then(areas => {
      cy.spy(areas, "deleteWindow");
      try {
        areas.deleteWindow(1);
      } catch {
      } finally {
        expect(areas.deleteWindow).to.have.throw();
      }
    });
  })
});

describe('Dual vertical areas', () => {
  beforeEach(() => {
    const cfg = {
      components: [
        { render(h) { return h("div", "Hey !") } },
        { render(h) { return h("div", "Ouille !") } }
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
    cy.get(AREA_SELECTOR).contains("Hey !");
    cy.get(AREA_SELECTOR).contains("Ouille !");

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);

      // TODO this should take into accout separator width !
      const area1TheoreticalWidth = WIDTH * 30 / 100;
      const area2TheoreticalWidth = WIDTH * 70 / 100;
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

      // TODO this should take into accout separator width !
      const area1TheoreticalWidth = WIDTH * 10 / 100;
      const area2TheoreticalWidth = WIDTH * 90 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
    });
  });

});

describe('Dual horizontal areas', () => {
  beforeEach(() => {
    const cfg = {
      components: [
        { render(h) { return h("div", "Hey !") } },
        { render(h) { return h("div", "Ouille !") } }
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
    cy.get(AREA_SELECTOR).contains("Hey !");
    cy.get(AREA_SELECTOR).contains("Ouille !");

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientWidth).to.equal(WIDTH);
      expect(area2.clientWidth).to.equal(WIDTH);

      // TODO this should take into accout separator width !
      const area1TheoreticalHeight = HEIGHT * 16 / 100;
      const area2TheoreticalHeight = HEIGHT * 84 / 100;
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

      // TODO this should take into accout separator width !
      const area1TheoreticalHeight = HEIGHT * 50 / 100;
      const area2TheoreticalHeight = HEIGHT * 50 / 100;
      expect(area1.clientHeight).to.be.closeTo(area1TheoreticalHeight, MARGIN_OF_ERROR);
      expect(area2.clientHeight).to.be.closeTo(area2TheoreticalHeight, MARGIN_OF_ERROR);
    });
  });

});

describe('Three areas in the same direction (vertical)', () => {
  beforeEach(() => {
    const cfg = {
      components: [
        { render(h) { return h("div", "Hey !") } },
        { render(h) { return h("div", "Ouille !") } },
        { render(h) { return h("div", "Ola !") } }
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
    cy.get(AREA_SELECTOR).contains("Hey !");
    cy.get(AREA_SELECTOR).contains("Ouille !");
    cy.get(AREA_SELECTOR).contains("Ola !");

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(3);
      const [area1, area2, area3] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);
      expect(area3.clientHeight).to.equal(HEIGHT);

      // TODO this should take into accout separator width !
      const area1TheoreticalWidth = WIDTH * 30 / 100;
      const area2TheoreticalWidth = WIDTH * 30 / 100;
      const area3TheoreticalWidth = WIDTH * 40 / 100;
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

      // TODO this should take into accout separator width !
      const area1TheoreticalWidth = WIDTH * 50 / 100;
      const area2TheoreticalWidth = WIDTH * 10 / 100;
      const area3TheoreticalWidth = WIDTH * 40 / 100;
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

      // TODO this should take into accout separator width !
      const area1TheoreticalWidth = WIDTH * 60 / 100;
      const area2TheoreticalWidth = 0;
      const area3TheoreticalWidth = WIDTH * 40 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area3.clientWidth).to.be.closeTo(area3TheoreticalWidth, MARGIN_OF_ERROR);
    });
  });

  it("Should fill the space and display the correct areas when deleting area", () => {

    cy.get(AREA_SELECTOR).contains("Hey !");
    cy.get(AREA_SELECTOR).contains("Ouille !");
    cy.get(AREA_SELECTOR).contains("Ola !");

    cy.get("@areas").invoke("deleteWindow", 2);

    cy.get(AREA_SELECTOR).contains("Hey !");
    cy.get(AREA_SELECTOR).contains("Ouille !").should("not.exist");
    cy.get(AREA_SELECTOR).contains("Ola !");

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);

      const area1TheoreticalWidth = WIDTH * 60 / 100;
      const area2TheoreticalWidth = WIDTH * 40 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
    });

    cy.get("@areas").invoke("deleteWindow", 1);

    cy.get(AREA_SELECTOR).contains("Hey !").should("not.exist");
    cy.get(AREA_SELECTOR).contains("Ouille !").should("not.exist");
    cy.get(AREA_SELECTOR).contains("Ola !");

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
      components: [
        { render(h) { return h("div", "Hey !") } },
        { render(h) { return h("div", "Ouille !") } },
        { render(h) { return h("div", "Ola !") } }
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
    cy.get(AREA_SELECTOR).contains("Hey !");
    cy.get(AREA_SELECTOR).contains("Ouille !");
    cy.get(AREA_SELECTOR).contains("Ola !");

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(3);
      const [area1, area2, area3] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      const area2TheoreticalHeight = HEIGHT * 15 / 100;
      const area3TheoreticalHeight = HEIGHT * 85 / 100;
      expect(area2.clientHeight).to.be.closeTo(area2TheoreticalHeight, MARGIN_OF_ERROR);
      expect(area3.clientHeight).to.be.closeTo(area3TheoreticalHeight, MARGIN_OF_ERROR);

      const area1TheoreticalWidth = WIDTH * 20 / 100;
      const area2TheoreticalWidth = WIDTH * 80 / 100;
      const area3TheoreticalWidth = WIDTH * 80 / 100;
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
      const area2TheoreticalHeight = HEIGHT * 15 / 100;
      const area3TheoreticalHeight = HEIGHT * 85 / 100;
      expect(area2.clientHeight).to.be.closeTo(area2TheoreticalHeight, MARGIN_OF_ERROR);
      expect(area3.clientHeight).to.be.closeTo(area3TheoreticalHeight, MARGIN_OF_ERROR);

      const area1TheoreticalWidth = WIDTH * 50 / 100;
      const area2TheoreticalWidth = WIDTH * 50 / 100;
      const area3TheoreticalWidth = WIDTH * 50 / 100;
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
      const area2TheoreticalHeight = HEIGHT * 78 / 100;
      const area3TheoreticalHeight = HEIGHT * 22 / 100;
      expect(area2.clientHeight).to.be.closeTo(area2TheoreticalHeight, MARGIN_OF_ERROR);
      expect(area3.clientHeight).to.be.closeTo(area3TheoreticalHeight, MARGIN_OF_ERROR);

      const area1TheoreticalWidth = WIDTH * 50 / 100;
      const area2TheoreticalWidth = WIDTH * 50 / 100;
      const area3TheoreticalWidth = WIDTH * 50 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area3.clientWidth).to.be.closeTo(area3TheoreticalWidth, MARGIN_OF_ERROR);
    });
  });

  it("Should fill the space and display the correct areas when deleting area", () => {
    cy.get(AREA_SELECTOR).contains("Ouille !");
    cy.get(AREA_SELECTOR).contains("Ola !");
    cy.get(AREA_SELECTOR).contains("Hey !");

    cy.get("@areas").invoke("deleteWindow", 3);

    cy.get(AREA_SELECTOR).contains("Ouille !");
    cy.get(AREA_SELECTOR).contains("Ola !");
    cy.get(AREA_SELECTOR).contains("Hey !").should('not.exist');

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(2);
      const [area1, area2] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      expect(area2.clientHeight).to.equal(HEIGHT);

      const area1TheoreticalWidth = WIDTH * 20 / 100;
      const area2TheoreticalWidth = WIDTH * 80 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
    });

    cy.get("@areas").invoke("deleteWindow", 1);

    cy.get(AREA_SELECTOR).contains("Ouille !").should('not.exist');
    cy.get(AREA_SELECTOR).contains("Ola !");
    cy.get(AREA_SELECTOR).contains("Hey !").should('not.exist');

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(1);
      const [area2] = els;

      expect(area2.clientHeight).to.equal(HEIGHT);
      expect(area2.clientWidth).to.equal(WIDTH);
    });

  });

  it('Should display the correct content after swapping areas content', () => {
    cy.get(`#${ID_PREFIX}1`).contains("Ouille !");
    cy.get(`#${ID_PREFIX}2`).contains("Ola !");
    cy.get(`#${ID_PREFIX}3`).contains("Hey !");
    cy.get("@areas").invoke("swapWindows", 1, 2);
    cy.get(`#${ID_PREFIX}1`).contains("Ola !");
    cy.get(`#${ID_PREFIX}2`).contains("Ouille !");
    cy.get(`#${ID_PREFIX}3`).contains("Hey !");
    cy.get("@areas").invoke("swapWindows", 1, 3);
    cy.get(`#${ID_PREFIX}1`).contains("Hey !");
    cy.get(`#${ID_PREFIX}2`).contains("Ouille !");
    cy.get(`#${ID_PREFIX}3`).contains("Ola !");
  });

  it("Should save and load layout", () => {
    cy.get("@areas").then(areas => areas.getCurrentLayout()).as('savedLayout');

    cy.get(SEPARATOR_SELECTOR)
      .first()
      .trigger('mousedown', "center")
      .trigger("mousemove", { clientX: WIDTH / 2 })
      .trigger('mouseup');

    cy.get("@areas").invoke("deleteWindow", 3);

    cy.get("@areas")
      .then(areas => cy.get("@savedLayout").then(savedLayout => areas.loadLayout(savedLayout)));

    cy.get(`#${ID_PREFIX}4`).contains("Ouille !");
    cy.get(`#${ID_PREFIX}5`).contains("Ola !");
    cy.get(`#${ID_PREFIX}6`).contains("Hey !");

    cy.get(AREA_SELECTOR).should(els => {
      expect(els).to.have.length(3);
      const [area1, area2, area3] = els;

      expect(area1.clientHeight).to.equal(HEIGHT);
      const area2TheoreticalHeight = HEIGHT * 15 / 100;
      const area3TheoreticalHeight = HEIGHT * 85 / 100;
      expect(area2.clientHeight).to.be.closeTo(area2TheoreticalHeight, MARGIN_OF_ERROR);
      expect(area3.clientHeight).to.be.closeTo(area3TheoreticalHeight, MARGIN_OF_ERROR);

      const area1TheoreticalWidth = WIDTH * 20 / 100;
      const area2TheoreticalWidth = WIDTH * 80 / 100;
      const area3TheoreticalWidth = WIDTH * 80 / 100;
      expect(area1.clientWidth).to.be.closeTo(area1TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area2.clientWidth).to.be.closeTo(area2TheoreticalWidth, MARGIN_OF_ERROR);
      expect(area3.clientWidth).to.be.closeTo(area3TheoreticalWidth, MARGIN_OF_ERROR);
    });
  })
});