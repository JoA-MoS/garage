module.exports = {
  '*': (filesArray) => {
    const files = filesArray.join();
    return [
      `nx affected:lint --fix --files=${files}`,
      `nx format:write --files=${files}`,
    ];
  },
};
