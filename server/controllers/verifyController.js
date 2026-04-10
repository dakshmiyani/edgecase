const verifyProof = require("../utils/zkVerify");

exports.verifyUser = async (req, res) => {
  try {
    const { proof, publicSignals } = req.body;

    // Cryptographically verify the anon-aadhaar proof
    const isValid = await verifyProof(proof, publicSignals);

    if (isValid) {
      // In a real application, you might generate a JWT here based on the anonymous hash
      // The frontend would use this random ID for future requests
      const anonymousId = "zk_" + Math.random().toString(36).substring(2, 10);
      
      return res.json({ 
        isVerified: true, 
        userId: anonymousId,
        message: "Cryptographic proof verified. Proceeding without PII."
      });
    }

    res.status(400).json({ isVerified: false, message: "Invalid Proof" });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ isVerified: false, message: "Server Error" });
  }
};
