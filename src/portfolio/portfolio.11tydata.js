// Settings for every project in this folder.
export default {
  layout: "layouts/project.liquid",
  body_class: "page-project",
  eleventyComputed: {
    // A project with `published: false` is not built and not listed anywhere.
    permalink: (data) => (data.published === false ? false : `/portfolio/${data.page.fileSlug}/`),
    eleventyExcludeFromCollections: (data) => data.published === false,
  },
};
