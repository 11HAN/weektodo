export default {
    configList(vue) {
        const desktopLinks = vue.isDesktopMode ? [
            {
              name: vue.$t('settings.desktopAppearance'),
              ico: "bi-palette",
              linktype: "tagId",
              link: "config-desktop-appearance-tab",
            },
            {
              name: vue.$t('settings.desktopWidget'),
              ico: "bi-window",
              linktype: "tagId",
              link: "config-desktop-widget-tab",
            },
          ] : [];

        return [
            ...desktopLinks,
            {
              name: vue.$t('settings.general'),
              ico: "bi-sliders",
              linktype: "tagId",
              link: "config-general-tab",
            },
            {
              name: vue.$t('settings.behavior'),
              ico: "bi-shuffle",
              linktype: "tagId",
              link: "config-behavior-tab",
            },
            {
              name: vue.$t('settings.display'),
              ico: "bi-eye",
              linktype: "tagId",
              link: "config-display-tab",
            },
            {
              name: vue.$t('settings.notifications'),
              ico: "bi-bell",
              linktype: "tagId",
              link: "config-notifications-tab",
            },
            {
              name: vue.$t('settings.data'),
              ico: "bi-pie-chart",
              linktype: "tagId",
              link: "config-data-tab",
            },
            {
              name: vue.$t('settings.language'),
              ico: "bi-globe2",
              linktype: "tagId",
              link: "config-language-tab",
            },
            {
              name: vue.$t('settings.about'),
              ico: "bi-info-circle",
              linktype: "tagId",
              link: "config-about-tab",
            },
          ]
    }
}