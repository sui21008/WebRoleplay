const Learner = require("../classes/Learner");

exports.toLearnerInstance = (learner_obj) => {
    const learner = new Learner(learner_obj.comp, learner_obj.reqComp, learner_obj.reqRole);
    return learner;
}