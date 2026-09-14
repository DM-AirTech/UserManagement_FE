import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./contactform.css";

const ContactForm = () => {
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-API-Key": localStorage.getItem("userApiKey"),
        },
        body: JSON.stringify({
          email,
          subject: "Corporate Plan",
          message: query,
        }),
      });

      if (res.ok) {
        toast.success("✅ Message sent successfully!");
        setTimeout(() => navigate("/subscribe"), 2000);
      } else {
        toast.error("❌ Failed to send message. Try again later.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="contact-form-container">
      <h2>Contact Us About the Corporate Plan</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Your Email:
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Describe/Details of Query:
          <textarea
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Write your message here..."
          />
        </label>
        <label>
          Subject:
          <input type="text" value="Corporate Plan" readOnly />
        </label>
        <button type="submit">Send Message</button>
      </form>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ContactForm;