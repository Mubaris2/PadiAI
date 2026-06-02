export function parseConstraints(constraintsText) {
  if (!constraintsText) {
    return { timeLimit: 2.0, memoryLimit: 256 };
  }
  const timeMatch = constraintsText.match(/(\d+(?:\.\d+)?)\s*s(?:ec|econds?)?/i);
  const memMatch = constraintsText.match(/(\d+)\s*(?:MB|mb|megabytes?)/i);
  
  return {
    timeLimit: timeMatch ? parseFloat(timeMatch[1]) : 2.0,
    memoryLimit: memMatch ? parseInt(memMatch[1]) : 256,
  };
}
