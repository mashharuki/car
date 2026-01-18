import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  LicensePlateAccountFactory,
  PrivacyProtectedAccount,
  VehicleRegistry,
} from "../typechain-types";

describe("LicensePlateAccountFactory", function () {
  let factory: LicensePlateAccountFactory;
  let registry: VehicleRegistry;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let entryPoint: string;

  const ENTRYPOINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    entryPoint = ENTRYPOINT_ADDRESS;

    // Deploy LicensePlateAccountFactory
    const LicensePlateAccountFactory = await ethers.getContractFactory(
      "LicensePlateAccountFactory"
    );
    factory = await LicensePlateAccountFactory.deploy(entryPoint);
    await factory.waitForDeployment();

    // Deploy VehicleRegistry
    const VehicleRegistry = await ethers.getContractFactory("VehicleRegistry");
    registry = await VehicleRegistry.deploy();
    await registry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await factory.getAddress()).to.be.properAddress;
    });

    it("Should have correct EntryPoint", async function () {
      const accountImpl = await factory.accountImplementation();
      const account = await ethers.getContractAt(
        "PrivacyProtectedAccount",
        accountImpl
      );
      expect(await account.entryPoint()).to.equal(entryPoint);
    });

    it("Should start with ZK proof not required", async function () {
      expect(await factory.zkProofRequired()).to.equal(false);
    });
  });

  describe("License Plate Commitment", function () {
    const plateNumber = "品川330あ1234"; // Example Japanese license plate
    let userSalt: string;
    let commitment: string;

    beforeEach(async function () {
      // Generate salt (in production, this should be cryptographically secure)
      userSalt = ethers.id("user-secret-entropy");

      // Compute commitment (this should be done off-chain in production)
      commitment = await factory.computePlateCommitment(plateNumber, userSalt);
    });

    it("Should compute consistent commitment", async function () {
      const commitment2 = await factory.computePlateCommitment(
        plateNumber,
        userSalt
      );
      expect(commitment).to.equal(commitment2);
    });

    it("Should compute different commitments for different salts", async function () {
      const differentSalt = ethers.id("different-secret");
      const commitment2 = await factory.computePlateCommitment(
        plateNumber,
        differentSalt
      );
      expect(commitment).to.not.equal(commitment2);
    });

    it("Should compute different commitments for different plates", async function () {
      const differentPlate = "横浜501さ5678";
      const commitment2 = await factory.computePlateCommitment(
        differentPlate,
        userSalt
      );
      expect(commitment).to.not.equal(commitment2);
    });
  });

  describe("Account Creation", function () {
    const plateNumber = "品川330あ1234";
    let userSalt: string;
    let commitment: string;
    let deploymentSalt: number;

    beforeEach(async function () {
      userSalt = ethers.id("user-secret");
      commitment = await factory.computePlateCommitment(plateNumber, userSalt);
      deploymentSalt = 12345;
    });

    it("Should create account from license plate", async function () {
      const tx = await factory.createAccountFromPlate(
        user.address,
        commitment,
        deploymentSalt,
        "0x" // No proof (ZK not required)
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Verify account was created
      const predictedAddress = await factory.getAddressFromPlate(
        user.address,
        commitment,
        deploymentSalt
      );

      const account = await ethers.getContractAt(
        "PrivacyProtectedAccount",
        predictedAddress
      );

      expect(await account.owner()).to.equal(user.address);
      expect(await account.vehicleCommitment()).to.equal(commitment);
    });

    it("Should predict correct address before deployment", async function () {
      const predictedAddress = await factory.getAddressFromPlate(
        user.address,
        commitment,
        deploymentSalt
      );

      await factory.createAccountFromPlate(
        user.address,
        commitment,
        deploymentSalt,
        "0x"
      );

      const account = await ethers.getContractAt(
        "PrivacyProtectedAccount",
        predictedAddress
      );

      expect(await account.getAddress()).to.equal(predictedAddress);
    });

    it("Should return existing account on second call", async function () {
      const tx1 = await factory.createAccountFromPlate(
        user.address,
        commitment,
        deploymentSalt,
        "0x"
      );
      await tx1.wait();

      const tx2 = await factory.createAccountFromPlate(
        user.address,
        commitment,
        deploymentSalt,
        "0x"
      );
      await tx2.wait();

      // Should not fail, returns existing account
      const predictedAddress = await factory.getAddressFromPlate(
        user.address,
        commitment,
        deploymentSalt
      );

      const account = await ethers.getContractAt(
        "PrivacyProtectedAccount",
        predictedAddress
      );

      expect(await account.owner()).to.equal(user.address);
    });

    it("Should create different accounts for different salts", async function () {
      const salt1 = 11111;
      const salt2 = 22222;

      await factory.createAccountFromPlate(
        user.address,
        commitment,
        salt1,
        "0x"
      );

      await factory.createAccountFromPlate(
        user.address,
        commitment,
        salt2,
        "0x"
      );

      const address1 = await factory.getAddressFromPlate(
        user.address,
        commitment,
        salt1
      );
      const address2 = await factory.getAddressFromPlate(
        user.address,
        commitment,
        salt2
      );

      expect(address1).to.not.equal(address2);
    });
  });

  describe("Privacy Protection", function () {
    const plateNumber = "品川330あ1234";
    let userSalt: string;
    let commitment: string;

    beforeEach(async function () {
      userSalt = ethers.id("user-secret");
      commitment = await factory.computePlateCommitment(plateNumber, userSalt);

      await factory.createAccountFromPlate(
        user.address,
        commitment,
        12345,
        "0x"
      );
    });

    it("Should not expose plate number in storage", async function () {
      const accountAddress = await factory.getAddressFromPlate(
        user.address,
        commitment,
        12345
      );

      // Check first 20 storage slots
      for (let i = 0; i < 20; i++) {
        const storage = await ethers.provider.getStorage(accountAddress, i);
        const plateBytes = ethers.toUtf8Bytes(plateNumber);
        const plateHex = ethers.hexlify(plateBytes);

        // Storage should not contain raw plate number
        expect(storage.toLowerCase()).to.not.include(
          plateHex.slice(2).toLowerCase()
        );
      }
    });

    it("Should verify ownership with correct preimage", async function () {
      const accountAddress = await factory.getAddressFromPlate(
        user.address,
        commitment,
        12345
      );

      const account = await ethers.getContractAt(
        "PrivacyProtectedAccount",
        accountAddress
      );

      const isValid = await account.verifyVehicleOwnership(
        plateNumber,
        userSalt
      );
      expect(isValid).to.be.true;
    });

    it("Should reject wrong plate number", async function () {
      const accountAddress = await factory.getAddressFromPlate(
        user.address,
        commitment,
        12345
      );

      const account = await ethers.getContractAt(
        "PrivacyProtectedAccount",
        accountAddress
      );

      const isValid = await account.verifyVehicleOwnership(
        "横浜501さ5678", // Wrong plate
        userSalt
      );
      expect(isValid).to.be.false;
    });

    it("Should reject wrong salt", async function () {
      const accountAddress = await factory.getAddressFromPlate(
        user.address,
        commitment,
        12345
      );

      const account = await ethers.getContractAt(
        "PrivacyProtectedAccount",
        accountAddress
      );

      const wrongSalt = ethers.id("wrong-secret");
      const isValid = await account.verifyVehicleOwnership(
        plateNumber,
        wrongSalt
      );
      expect(isValid).to.be.false;
    });
  });

  describe("ZK Proof Integration", function () {
    it("Should allow enabling ZK proof requirement", async function () {
      await factory.setZKProofRequired(true);
      expect(await factory.zkProofRequired()).to.be.true;
    });

    it("Should require proof when ZK is enabled", async function () {
      await factory.setZKProofRequired(true);

      const userSalt = ethers.id("user-secret");
      const commitment = await factory.computePlateCommitment(
        "品川330あ1234",
        userSalt
      );

      await expect(
        factory.createAccountFromPlate(user.address, commitment, 12345, "0x")
      ).to.be.revertedWith("LicensePlateAccountFactory: proof required");
    });

    it("Should require verifier to be set when ZK is enabled", async function () {
      await factory.setZKProofRequired(true);

      const userSalt = ethers.id("user-secret");
      const commitment = await factory.computePlateCommitment(
        "品川330あ1234",
        userSalt
      );

      // Even with proof data, should fail if verifier not set
      await expect(
        factory.createAccountFromPlate(
          user.address,
          commitment,
          12345,
          "0x1234" // Mock proof
        )
      ).to.be.revertedWith("LicensePlateAccountFactory: ZK verifier not set");
    });
  });

  describe("Batch Operations", function () {
    it("Should create multiple accounts in batch", async function () {
      const owners = [user.address, owner.address];
      const commitments = [
        await factory.computePlateCommitment("品川330あ1234", ethers.id("salt1")),
        await factory.computePlateCommitment("横浜501さ5678", ethers.id("salt2")),
      ];
      const salts = [11111, 22222];
      const proofs: string[] = [];

      const tx = await factory.createAccountsFromPlatesBatch(
        owners,
        commitments,
        salts,
        proofs
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Verify both accounts exist
      const address1 = await factory.getAddressFromPlate(
        owners[0],
        commitments[0],
        salts[0]
      );
      const address2 = await factory.getAddressFromPlate(
        owners[1],
        commitments[1],
        salts[1]
      );

      const account1 = await ethers.getContractAt(
        "PrivacyProtectedAccount",
        address1
      );
      const account2 = await ethers.getContractAt(
        "PrivacyProtectedAccount",
        address2
      );

      expect(await account1.owner()).to.equal(owners[0]);
      expect(await account2.owner()).to.equal(owners[1]);
    });
  });
});
