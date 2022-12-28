const chalk = require('chalk');

function getItDescription(oneApiData) {
  return `'props.${oneApiData.field_name} works fine'`;
}

function getMountCode(framework, componentCode) {
  if (framework === 'Vue(PC)') {
    return [
      `mount({
        render() {
          return (
            ${componentCode}
          );
        }
      })`
    ];
  }
  if (framework === 'VueNext(PC)') {
    return `mount(${componentCode})`;
  }
}

function getFullMountCode(framework, componentCode) {
  if (framework === 'Vue(PC)') {
    return [
      `mount({
        render() {
          return (
            ${componentCode}
          );
        }
      })`
    ];
  }
  if (['VueNext(PC)', 'Vue(Mobile)'].includes(framework)) {
    return componentCode.length > 100 ? `mount(\n${componentCode}\n)` : `mount(${componentCode})`;
  }
  if (['React(PC)', 'React(Mobile)'].includes(framework)) {
    return componentCode.length > 100 ? `render(\n${componentCode}\n)` : `render(${componentCode})`;
  }
}

function filterObject(obj) {
  Object.keys(obj).forEach((key) => {
    if (key === undefined) {
      delete obj[key];
    }
  });
}

/**
 * 获取测试组件实例
 * @param {String} framework 框架名称
 * @param {String} component 组件名称
 * @param {Object} props API 属性和对应的值，如：{ disabled: true }
 * @param {Object} extra 在 API 系统中录入的内容
 *  extra.content 子节点内容，如：{ content: '' }；有的组件存在子节点（如 Button），有的组件不需要子节点（如 Divider）。
 *  extra.wrapper 获取组件实例的方法，复杂组件需要预设测试实例，以便不同的测试用例复用，如：{ wrapper: 'getNormalTableMount' }；
 */
function getMountComponent(framework, component, props, extra = {}) {
  const { content, wrapper } = extra;
  filterObject(props);
  let mountComponent = '';
  // item 是代码关键词，不能作为字符串存在
  if (wrapper) {
    mountComponent = props && Object.keys(props).length
      ? `${wrapper}(${component}, ${JSON.stringify(props).replace(/"item"/g, 'item')})`
      : `${wrapper}(${component})`;
    return mountComponent;
  } else {
    const properties = props
      ? Object.keys(props).map((key) => `${key}={${props[key]}}`).join(' ')
      : '';
    mountComponent = `<${component} ${properties}>${content || ''}</${component}>`;
  }
  return getFullMountCode(framework, mountComponent);
}

/**
 * 获取快照代码
 * @param {Boolean} snapshot 是否输出快照
 * @param {String} framework 框架名
 * @param {String} wrapperIndex 同一个函数中，避免重复变量名，给变量名添加下标字符串，如：wrapper1, container2
 * @returns 快照代码
 */
function getSnapshotCase(snapshot, framework, wrapperIndex = '') {
  if (!snapshot) return;
  if (framework.indexOf('Vue') !== -1) {
    return `expect(wrapper${wrapperIndex}.element).toMatchSnapshot();`
  }
  if (framework.indexOf('React') !== -1) {
    return `expect(container${wrapperIndex}).toMatchSnapshot();`
  }
}

/**
 * 或者测试实例定义
 * @param {String} framework 框架名称
 * @param {String} mountCode 测试代码实例，如：<Button disabled={true} /> 或者 getNormalTableMount(BaseTable, { bordered: false })
 * @param {*} wrapperIndex 同一个函数中，避免重复变量名，给变量名添加下标字符串，如：wrapper1, container2
 * @returns 
 */
function getWrapper(framework, mountCode, wrapperIndex = '') {
  if (framework.indexOf('Vue') !== -1) {
    return `const wrapper${wrapperIndex} = ${mountCode};`;
  }
  if (framework.indexOf('React') !== -1) {
    if (wrapperIndex) {
      return `const { container: container${wrapperIndex} } = ${mountCode};`;
    }
    return `const { container } = ${mountCode};`;
  }
}

function getArrayCode(arr) {
  return `[${arr.map(val => typeof val === 'string' ? `'${val}'` : JSON.stringify(val)).join(', ')}]`;
}

function parseJSON(json, error = '') {
  try {
    return JSON.parse(json);
  } catch (e) {
    console.log(chalk.red(error || `${json} is not a JSON.`));
    return {};
  }
}

module.exports = {
  getItDescription,
  getWrapper,
  getMountComponent,
  getSnapshotCase,
  getMountCode,
  getArrayCode,
  parseJSON,
};