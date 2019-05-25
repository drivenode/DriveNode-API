let assert = require("assert");
var ldap = require('ldapjs');
var client = ldap.createClient({
    url: 'ldap://127.0.0.1:389/cn=admin,dc=drivenode,dc=com'
});

var entry = {
    cn: 'foo',
    sn: 'bar',
    email: ['foo@bar.com', 'foo1@bar.com'],
    objectclass: 'fooPerson'
};
client.add('cn=foo, o=example', entry, function (err) {
    assert.ifError(err);
});