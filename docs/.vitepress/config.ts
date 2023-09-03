import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: 'Eccy',
	description: 'Yet Another ECS Library',

	srcDir: 'src/',
	base: '/eccy/',

	themeConfig: {
		sidebar: [
			{
				text: 'Introduction',
				items: [
					{ text: 'Getting Started', link: '/getting-started/' },
				],
			},
		],

		socialLinks: [
			{ icon: 'github', link: 'https://github.com/woubuc/eccy' },
		],
	},
});
