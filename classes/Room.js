class Room{
    constructor(createdLearner, roomID){
        this.createdLearner = createdLearner;
        this.roomID = roomID;
        this.roles = {
            createdLearnerRole: null,             
            joinedLearnerRole: null
        };
        this.isMatchable = true;
    }

    get minReqComp(){
        return this.createdLearner.minReqComp;
    }

    get maxReqComp(){
        return this.createdLearner.maxReqComp;
    }

    clone(){
        const clonedRoom = new Room(
            this.createdLearner.clone(), 
            this.roomID
        );

        clonedRoom.roles = {
            createdLearnerRole: this.roles.createdLearnerRole,
            joinedLearnerRole: this.roles.joinedLearnerRole
        };

        clonedRoom.isMatchable = this.isMatchable;

        return clonedRoom;
    }
}
module.exports = Room;