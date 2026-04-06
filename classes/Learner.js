const fs = require('fs');
const config = JSON.parse(fs.readFileSync("config/config.json"));

const ct = config.comprehensionTolerance;
const ts = config.toleranceStep;


class Learner{
    constructor(comp, reqComp, reqRole){
        this.comp = comp;
        this.reqComp = reqComp;
        if(reqComp === "high"){            
            this.minReqComp = comp + ct;
            this.maxReqComp = 100;
        }else if(reqComp === "low"){
            this.minReqComp = 0;         
            this.maxReqComp = comp - ct;
        }else{
            this.minReqComp = comp - ct;
            this.maxReqComp = comp + ct;
        }
        if(this.minReqComp < 0){
            this.minReqComp = 0;
        }
        if(this.minReqComp > 100){
            this.minReqComp = 100;
        }
        if(this.maxReqComp < 0){
            this.maxReqComp = 0;
        }
        if(this.maxReqComp > 100){
            this.maxReqComp = 100;
        }
        this.reqRole = reqRole;
    }

    clone() {
        return new Learner(this.comp, this.reqComp, this.reqRole);
    }
    expandRange(){
        if(this.reqComp === "high"){
            this.minReqComp = this.minReqComp - ts;
        }else if(this.reqComp === "middle"){
            this.minReqComp = this.minReqComp - ts/2;
            this.maxReqComp = this.maxReqComp + ts/2;
        }else if(this.reqComp === "low"){
            this.maxReqComp = this.maxReqComp + ts;
        }
        if(this.minReqComp < 0){
            this.minReqComp = 0;
        }
        if(this.minReqComp > 100){
            this.minReqComp = 100;
        }
        if(this.maxReqComp < 0){
            this.maxReqComp = 0;
        }
        if(this.maxReqComp > 100){
            this.maxReqComp = 100;
        }
    }
    
    
}
module.exports = Learner;