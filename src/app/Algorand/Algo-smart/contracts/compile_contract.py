#!/usr/bin/env python3
"""
Safient AI Contract Compilation Utility
Compiles PyTeal contracts to TEAL and bytecode for deployment
"""

import os
import sys
import json
import base64
from pathlib import Path
from typing import Tuple, Dict, Any

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import algosdk
    from pyteal import *
    from safient_ai_contract import (
        compile_safient_ai_contract,
        get_contract_schema
    )
except ImportError as e:
    print(f"Error importing required modules: {e}")
    print("Please install: pip install pyteal py-algorand-sdk")
    sys.exit(1)

class SafientAIContractCompiler:
    """
    Utility class for compiling Safient AI contracts
    """
    
    def __init__(self, output_dir: str = "compiled"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
    def compile_contract(self) -> Dict[str, Any]:
        """
        Compile the Safient AI contract and return compilation results
        """
        print("🔨 Compiling Safient AI contract...")
        
        try:
            # Compile TEAL programs
            approval_teal, clear_state_teal = compile_safient_ai_contract()
            
            # Get schema information
            global_schema, local_schema = get_contract_schema()
            
            # Save TEAL files
            approval_file = self.output_dir / "safient_ai_approval.teal"
            clear_state_file = self.output_dir / "safient_ai_clear_state.teal"
            
            with open(approval_file, "w") as f:
                f.write(approval_teal)
                
            with open(clear_state_file, "w") as f:
                f.write(clear_state_teal)
            
            # Compile to bytecode (requires algod client)
            # For now, we'll save the TEAL and let the deployment script handle bytecode
            
            compilation_result = {
                "success": True,
                "approval_teal": approval_teal,
                "clear_state_teal": clear_state_teal,
                "approval_file": str(approval_file),
                "clear_state_file": str(clear_state_file),
                "global_schema": {
                    "num_uints": global_schema.num_uints,
                    "num_byte_slices": global_schema.num_byte_slices
                },
                "local_schema": {
                    "num_uints": local_schema.num_uints,
                    "num_byte_slices": local_schema.num_byte_slices
                },
                "contract_info": {
                    "name": "Safient Branded Transfer Contract",
                    "version": "1.0.0",
                    "description": "Safient controlled staging flow with return and release operations",
                    "methods": [
                        "safient_lock",
                        "safient_return", 
                        "safient_release",
                        "safient_status"
                    ]
                }
            }
            
            # Save compilation metadata
            metadata_file = self.output_dir / "contract_metadata.json"
            with open(metadata_file, "w") as f:
                json.dump(compilation_result, f, indent=2, default=str)
            
            print(f"✅ Contract compiled successfully!")
            print(f"📁 Output directory: {self.output_dir}")
            print(f"📄 Approval TEAL: {approval_file}")
            print(f"📄 Clear state TEAL: {clear_state_file}")
            print(f"📊 Metadata: {metadata_file}")
            print(f"🔢 Global state: {global_schema.num_uints} uints, {global_schema.num_byte_slices} bytes")
            print(f"🔢 Local state: {local_schema.num_uints} uints, {local_schema.num_byte_slices} bytes")
            
            return compilation_result
            
        except Exception as e:
            error_result = {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }
            print(f"❌ Compilation failed: {e}")
            return error_result
    
    def compile_with_algod(self, algod_client) -> Dict[str, Any]:
        """
        Compile contract with algod client to get bytecode
        """
        print("🔨 Compiling Safient AI contract with algod...")
        
        try:
            # First compile to TEAL
            result = self.compile_contract()
            if not result["success"]:
                return result
            
            # Compile TEAL to bytecode
            approval_bytecode = algod_client.compile(result["approval_teal"])
            clear_state_bytecode = algod_client.compile(result["clear_state_teal"])
            
            # Add bytecode to result
            result["approval_bytecode"] = approval_bytecode["result"]
            result["clear_state_bytecode"] = clear_state_bytecode["result"]
            result["approval_hash"] = approval_bytecode["hash"]
            result["clear_state_hash"] = clear_state_bytecode["hash"]
            
            # Save bytecode files
            approval_bytecode_file = self.output_dir / "safient_ai_approval.bytecode"
            clear_state_bytecode_file = self.output_dir / "safient_ai_clear_state.bytecode"
            
            with open(approval_bytecode_file, "w") as f:
                f.write(approval_bytecode["result"])
                
            with open(clear_state_bytecode_file, "w") as f:
                f.write(clear_state_bytecode["result"])
            
            result["approval_bytecode_file"] = str(approval_bytecode_file)
            result["clear_state_bytecode_file"] = str(clear_state_bytecode_file)
            
            # Update metadata
            metadata_file = self.output_dir / "contract_metadata.json"
            with open(metadata_file, "w") as f:
                json.dump(result, f, indent=2, default=str)
            
            print(f"✅ Contract compiled with bytecode!")
            print(f"🔐 Approval hash: {approval_bytecode['hash']}")
            print(f"🔐 Clear state hash: {clear_state_bytecode['hash']}")
            
            return result
            
        except Exception as e:
            error_result = {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }
            print(f"❌ Compilation with algod failed: {e}")
            return error_result
    
    def validate_contract(self) -> bool:
        """
        Validate the compiled contract
        """
        try:
            # Try to compile - if it succeeds, contract is valid
            result = self.compile_contract()
            return result["success"]
        except Exception:
            return False

def main():
    """
    Main compilation script
    """
    print("🚀 Safient AI Contract Compiler")
    print("=" * 40)
    
    compiler = SafientAIContractCompiler()
    
    # Check if algod connection is available for bytecode compilation
    try:
        # Try to connect to local algod (testnet)
        algod_client = algosdk.v2client.algod.AlgodClient(
            "",
            "https://testnet-api.algonode.cloud",
            headers={"X-API-Key": ""}
        )
        
        # Test connection
        algod_client.status()
        print("🌐 Connected to Algorand testnet")
        
        # Compile with bytecode
        result = compiler.compile_with_algod(algod_client)
        
    except Exception as e:
        print(f"⚠️  Could not connect to algod: {e}")
        print("📝 Compiling TEAL only...")
        
        # Compile TEAL only
        result = compiler.compile_contract()
    
    if result["success"]:
        print("\n🎉 Compilation completed successfully!")
        return 0
    else:
        print(f"\n💥 Compilation failed: {result['error']}")
        return 1

if __name__ == "__main__":
    sys.exit(main())