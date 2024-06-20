# Counter App HC-AA (Meta Mask Flask)


## Stack 
- Vite 
- React Ts
- [Shadcn UI](https://ui.shadcn.com/docs) 
- [Tailwind Css](https://tailwindcss.com/docs/installation)


## Clone 

```
git clone git@github.com:bobanetwork/aws-3tier-template.git

cd src/frontend/counter-web-app

```

## To Install deps.

``` yarn ```

## To start the local server  

```
yarn run dev
```

## Use shadcn ui 

Add Component Button 

```
  npx shadcn-ui@latest add button
```

You can now go ahead and customize your Button component and add more shadcn components from here.



# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
