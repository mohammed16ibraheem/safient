#!/usr/bin/env python3
"""
Safient AI Contract Deployment Utility
Deploys compiled Safient AI contracts to Algorand testnet/mainnet
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Dict, Any, Optional

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import algosdk
    from algosdk import account, mnemonic
    from algosdk.v2client import algod
    from algosdk.transaction import ApplicationCreateTxn, StateSchema, OnComplete
    from compile_contract import SafientAIContractCompiler
except ImportError as e:
    print(f"Error importing required modules: {e}")
    print("Please install: pip install py-algorand-sdk")
    sys.exit(1)

class SafientAIContractDeployer:
    """
    Utility class for deploying Safient AI contracts
    """
    
    def __init__(self, algod_client: algod.AlgodClient, network: str = "testnet"):
        self.algod_client = algod_client
        self.network = network
        self.compiler = SafientAIContractCompiler()
        
    def deploy_contract(
        self, 
        deployer_private_key: str,
        note: str = "Safient AI Contract Deployment"
    ) -> Dict[str, Any]:
        """
        Deploy the Safient AI contract
        """
        print(f"🚀 Deploying Safient AI contract to {self.network}...")
        
        try:
            # Get deployer account
            deployer_address = account.address_from_private_key(deployer_private_key)
            print(f"👤 Deployer address: {deployer_address}")
            
            # Check deployer balance
            account_info = self.algod_client.account_info(deployer_address)
            balance = account_info["amount"] / 1_000_000  # Convert to ALGO
            print(f"💰 Deployer balance: {balance:.6f} ALGO")
            
            if balance < 0.1:  # Minimum balance check
                raise Exception(f"Insufficient balance. Need at least 0.1 ALGO, have {balance:.6f} ALGO")
            
            # Compile contract
            print("🔨 Compiling contract...")
            compilation_result = self.compiler.compile_with_algod(self.algod_client)
            
            if not compilation_result["success"]:
                raise Exception(f"Contract compilation failed: {compilation_result['error']}")
            
            # Get compiled bytecode
            approval_program = compilation_result["approval_bytecode"]
            clear_state_program = compilation_result["clear_state_bytecode"]
            
            # Convert base64 to bytes
            approval_program_bytes = base64.b64decode(approval_program)
            clear_state_program_bytes = base64.b64decode(clear_state_program)
            
            # Create state schemas
            global_schema = StateSchema(
                num_uints=compilation_result["global_schema"]["num_uints"],
                num_byte_slices=compilation_result["global_schema"]["num_byte_slices"]
            )
            
            local_schema = StateSchema(
                num_uints=compilation_result["local_schema"]["num_uints"],
                num_byte_slices=compilation_result["local_schema"]["num_byte_slices"]
            )
            
            # Get suggested transaction parameters
            params = self.algod_client.suggested_params()
            
            # Create application creation transaction
            txn = ApplicationCreateTxn(
                sender=deployer_address,
                sp=params,
                on_complete=OnComplete.NoOpOC,
                approval_program=approval_program_bytes,
                clear_program=clear_state_program_bytes,
                global_schema=global_schema,
                local_schema=local_schema,
                note=note.encode()
            )
            
            # Sign transaction
            signed_txn = txn.sign(deployer_private_key)
            
            # Submit transaction
            print("📤 Submitting deployment transaction...")
            tx_id = self.algod_client.send_transaction(signed_txn)
            print(f"📋 Transaction ID: {tx_id}")
            
            # Wait for confirmation
            print("⏳ Waiting for confirmation...")
            confirmed_txn = self._wait_for_confirmation(tx_id)
            
            if confirmed_txn is None:
                raise Exception("Transaction confirmation timeout")
            
            # Get application ID
            app_id = confirmed_txn["application-index"]
            app_address = algosdk.logic.get_application_address(app_id)
            
            # Prepare deployment result
            deployment_result = {
                "success": True,
                "app_id": app_id,
                "app_address": app_address,
                "deployer_address": deployer_address,
                "transaction_id": tx_id,
                "network": self.network,
                "deployed_at": time.time(),
                "block_round": confirmed_txn["confirmed-round"],
                "compilation_result": compilation_result,
                "contract_info": {
                    "name": "Safient AI Transfer Contract",
                    "version": "1.0.0",
                    "description": "Secure transfer system with time-locked reclaim functionality"
                }
            }
            
            # Save deployment info
            self._save_deployment_info(deployment_result)
            
            print(f"✅ Contract deployed successfully!")
            print(f"🆔 Application ID: {app_id}")
            print(f"📍 Application Address: {app_address}")
            print(f"🔗 Transaction: {tx_id}")
            print(f"📦 Block Round: {confirmed_txn['confirmed-round']}")
            
            return deployment_result
            
        except Exception as e:
            error_result = {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }
            print(f"❌ Deployment failed: {e}")
            return error_result
    
    def _wait_for_confirmation(self, tx_id: str, timeout: int = 10) -> Optional[Dict]:
        """
        Wait for transaction confirmation
        """
        start_round = self.algod_client.status()["last-round"] + 1
        current_round = start_round
        
        while current_round < start_round + timeout:
            try:
                pending_txn = self.algod_client.pending_transaction_info(tx_id)
                if pending_txn.get("confirmed-round", 0) > 0:
                    return pending_txn
            except Exception:
                pass
            
            self.algod_client.status_after_block(current_round)
            current_round += 1
        
        return None
    
    def _save_deployment_info(self, deployment_result: Dict[str, Any]):
        """
        Save deployment information to file
        """
        output_dir = Path("deployed")
        output_dir.mkdir(exist_ok=True)
        
        # Save deployment info
        deployment_file = output_dir / f"safient_ai_deployment_{self.network}.json"
        with open(deployment_file, "w") as f:
            json.dump(deployment_result, f, indent=2, default=str)
        
        print(f"💾 Deployment info saved: {deployment_file}")
    
    def get_deployment_info(self) -> Optional[Dict[str, Any]]:
        """
        Load existing deployment information
        """
        deployment_file = Path("deployed") / f"safient_ai_deployment_{self.network}.json"
        
        if deployment_file.exists():
            with open(deployment_file, "r") as f:
                return json.load(f)
        
        return None

def create_algod_client(network: str = "testnet") -> algod.AlgodClient:
    """
    Create algod client for specified network
    """
    if network == "testnet":
        algod_address = "https://testnet-api.algonode.cloud"
        algod_token = ""
    elif network == "mainnet":
        algod_address = "https://mainnet-api.algonode.cloud"
        algod_token = ""
    else:
        # Local node
        algod_address = "http://localhost:4001"
        algod_token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    
    return algod.AlgodClient(algod_token, algod_address)

def main():
    """
    Main deployment script
    """
    print("🚀 Safient AI Contract Deployer")
    print("=" * 40)
    
    # Get network from command line or default to testnet
    network = sys.argv[1] if len(sys.argv) > 1 else "testnet"
    print(f"🌐 Target network: {network}")
    
    # Create algod client
    try:
        algod_client = create_algod_client(network)
        status = algod_client.status()
        print(f"✅ Connected to Algorand {network}")
        print(f"📊 Current round: {status['last-round']}")
    except Exception as e:
        print(f"❌ Failed to connect to {network}: {e}")
        return 1
    
    # Get deployer private key
    deployer_mnemonic = input("🔑 Enter deployer mnemonic (25 words): ").strip()
    
    if not deployer_mnemonic:
        print("❌ Mnemonic is required")
        return 1
    
    try:
        deployer_private_key = mnemonic.to_private_key(deployer_mnemonic)
    except Exception as e:
        print(f"❌ Invalid mnemonic: {e}")
        return 1
    
    # Create deployer and deploy
    deployer = SafientAIContractDeployer(algod_client, network)
    
    # Check if already deployed
    existing_deployment = deployer.get_deployment_info()
    if existing_deployment:
        print(f"⚠️  Contract already deployed: App ID {existing_deployment['app_id']}")
        redeploy = input("Deploy new instance? (y/N): ").strip().lower()
        if redeploy != 'y':
            print("Deployment cancelled")
            return 0
    
    # Deploy contract
    result = deployer.deploy_contract(deployer_private_key)
    
    if result["success"]:
        print("\n🎉 Deployment completed successfully!")
        print(f"🆔 Application ID: {result['app_id']}")
        print(f"📍 Application Address: {result['app_address']}")
        return 0
    else:
        print(f"\n💥 Deployment failed: {result['error']}")
        return 1

if __name__ == "__main__":
    import base64
    sys.exit(main())