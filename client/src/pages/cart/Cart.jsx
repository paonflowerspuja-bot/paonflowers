import React from "react";
import { useCart } from "../../context/CartContext";
import { Link } from "react-router-dom";

const Cart = () => {
  const { state, dispatch } = useCart();
  const cartItems = state.cart;

  const getTotal = () =>
    cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">Your Cart</h2>

      {cartItems.length === 0 ? (
        <div className="text-center">
          <p>Your cart is empty 😢</p>
          <Link to="/shop" className="btn btn-primary">
            Shop Now
          </Link>
        </div>
      ) : (
        <>
          <table className="table table-bordered align-middle">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price (AED)</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                        }}
                      />
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td>{item.price}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() =>
                          dispatch({
                            type: "DECREASE_QUANTITY",
                            payload: item.id,
                          })
                        }
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() =>
                          dispatch({
                            type: "INCREASE_QUANTITY",
                            payload: item.id,
                          })
                        }
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>{item.price * item.quantity}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() =>
                        dispatch({ type: "REMOVE_FROM_CART", payload: item.id })
                      }
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="d-flex justify-content-between align-items-center mt-4">
            <button
              className="btn btn-outline-danger"
              onClick={() => dispatch({ type: "CLEAR_CART" })}
            >
              Clear Cart
            </button>
            <h4>Total: AED{getTotal()}</h4>
            <Link to="/checkout" className="btn btn-success">
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
