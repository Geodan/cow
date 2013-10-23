projects:[{
    _id: char,
    _rev: char,
    timestamp: Date,
    data:{
        name: char,
        status: char,
        members:[char]//volatile
    }
}]

peers:[{
        //Do we need to keep a list of peers as id-name pairs ?
}]

groups:[{
     _id: char,
     _rev: char,
     timestamp: Date,
     data:{
         name: char,
         status: char,
         project_id: char, //1:1 ref to project 
         members:[{id:int, status:char}]
         groups:[{id:int, status:char}]
     }
}]

items:[{
    _id: char,
    _rev: char,
    timestamp: Date,
    data: {
        status:char
        perms:{
        }
        etc....
    }
}]


Start App

Initialize projectendb:
    CB: 1. Query voor 'sketch' project
        CB: if !sketch -> voeg sketch toe -> Query voor 'sketch' project 
            else ga verder met groepdb
        2. Query voor 'alle actieve projecten'
        CB: trigger 'projectenlijst'
    
        Initialize groependb:
            CB: Query voor 'sketch' project
