const { Wallets, Gateway } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');

async function main() {
    const gateway = new Gateway();

    try {
        const wallet = await Wallets.newFileSystemWallet('./wallet');

        const caURL = 'http://localhost:7054';
        const ca = new FabricCAServices(caURL);

        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('An identity for the admin user does not exist in the wallet');
            return;
        }

        const gatewayOptions = {
            identity: 'admin',
            wallet: wallet,
            discovery: { enabled: true, asLocalhost: true }
        };

        await gateway.connect('mychannel', gatewayOptions);

        const network = await gateway.getNetwork('mychannel');

        const contract = network.getContract('basic');

        // enrolling a user
        const enrollment = await ca.enroll({ enrollmentID: 'user1', enrollmentSecret: 'user1pw' });
        const userIdentity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        await wallet.put('user1', userIdentity);

        console.log('Successfully enrolled user1 and imported it into the wallet');

        // registering a new user
        const registerRequest = {
            enrollmentID: 'user2',
            affiliation: 'org1.department1',
            role: 'client',
        };

        const secret = await ca.register(registerRequest, adminIdentity);
        console.log(`Successfully registered user2 with enrollment secret: ${secret}`);

    } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1);
    } finally {
        gateway.disconnect();
    }
}

main();