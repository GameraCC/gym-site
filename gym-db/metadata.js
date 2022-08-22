/**
 * Metadata structure queriable by `USER#{USERNAME}` primary key and `#METADATA` secondary key
 */

const metadata = {
    user: {
        email: 'test@gmail.com',
        hash: '86dfa4ddeea18cb741aa1e74315323f2f9feb1a45ef9c36454f3250411667535',
        salt: '1a2b3c4d',
        first_name: 'TestFirst',
        last_name: 'TestLast',
        profile_picture: 'https://profile-picture.com',
        bio: 'Test Bio Description',
        location: {
            city: 'US',
            state: 'CA',
            country: 'USA'
        },
        ips: [{iat: 12345678, ip: '192.168.1.1'}]
    }
}
