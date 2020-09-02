const { Op } = require('sequelize');
const { Users, CurrencyShop, UserItems } = require('./dbObjects');

findSingleUser = (external_user_id) => {
    console.log(`Database access for user id: ${external_user_id}`)
    return Users.findOne({ where: { user_id: external_user_id } });
};

findTargetUser = (external_target_id) => {
    console.log(`Database access for target id: ${external_target_id}`)
    return Users.findOne({ where: { user_id: external_target_id } });
};

findBuyItem = (external_buyitem_id) => {
    console.log(`Database accessed for buyitem id: ${external_buyitem_id}`)
    return CurrencyShop.findOne({ where: { name: { [Op.like]: external_buyitem_id.toLowerCase() } } });
};

findUseItem = (external_useitem_id) => {
    console.log(`Database accessed for useitem id: ${external_buyitem_id}`)
    return CurrencyShop.findOne({ where: { name: { [Op.like]: external_useitem_id.toLowerCase() } } });
};

module.exports = {
    findSingleUser,
    findTargetUser,
    findBuyItem,
    findUseItem
};