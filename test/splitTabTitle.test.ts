import { assert } from "chai";
import {
  formatSplitTabTitleFromData,
  formatSplitViewTabTitleFromData,
  type SplitTabTitleData,
} from "../src/utils/splitTabTitle";

describe("splitTabTitle", function () {
  const primaryAttachment: SplitTabTitleData = {
    itemID: 1,
    kind: "attachment",
    displayTitle: "Paper PDF",
    attachmentFilename: "paper.pdf",
    parentTitle: "A Great Paper",
    firstCreator: "Smith",
    year: "2024",
    isPrimaryAttachment: true,
  };

  const secondaryAttachment: SplitTabTitleData = {
    itemID: 2,
    kind: "attachment",
    displayTitle: "Supplement PDF",
    attachmentFilename: "supplement.pdf",
    parentTitle: false,
    firstCreator: "Smith",
    year: "2024",
    isPrimaryAttachment: false,
  };

  it("formats primary attachments as title creator year", function () {
    assert.equal(
      formatSplitTabTitleFromData(primaryAttachment, "titleCreatorYear"),
      "A Great Paper - Smith - 2024",
    );
  });

  it("formats primary attachments as creator year title", function () {
    assert.equal(
      formatSplitTabTitleFromData(primaryAttachment, "creatorYearTitle"),
      "Smith - 2024 - A Great Paper",
    );
  });

  it("formats attachments as filename when requested", function () {
    assert.equal(
      formatSplitTabTitleFromData(primaryAttachment, "filename"),
      "paper.pdf",
    );
  });

  it("formats attachments as attachment title when requested", function () {
    assert.equal(
      formatSplitTabTitleFromData(primaryAttachment, "attachmentTitle"),
      "Paper PDF",
    );
  });

  it("prepends attachment title for non-primary attachments", function () {
    assert.equal(
      formatSplitTabTitleFromData(secondaryAttachment, "titleCreatorYear"),
      "Supplement PDF - Smith - 2024",
    );
  });

  it("puts attachment title last for non-primary attachments in creator year title mode", function () {
    assert.equal(
      formatSplitTabTitleFromData(secondaryAttachment, "creatorYearTitle"),
      "Smith - 2024 - Supplement PDF",
    );
  });

  it("falls back to title ordering when creator is missing", function () {
    assert.equal(
      formatSplitTabTitleFromData(
        {
          ...primaryAttachment,
          firstCreator: "",
        },
        "creatorYearTitle",
      ),
      "A Great Paper - 2024",
    );
  });

  it("uses a single title when both split panes show the same attachment", function () {
    assert.equal(
      formatSplitViewTabTitleFromData(
        primaryAttachment,
        primaryAttachment,
        "filename",
      ),
      "paper.pdf",
    );
  });

  it("joins different split pane titles with a separator", function () {
    assert.equal(
      formatSplitViewTabTitleFromData(
        primaryAttachment,
        secondaryAttachment,
        "filename",
      ),
      "paper.pdf | supplement.pdf",
    );
  });
});
