import SKILLS from "./skills.js";

const extractSkills = (text) => {
  const lowerText = text.toLowerCase();

  return SKILLS.filter((skill) => lowerText.includes(skill));
};

export default extractSkills;
