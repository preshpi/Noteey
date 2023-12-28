"use client";
import { NextPage } from "next";
import React, { useEffect, useRef, useState } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import { Cardsprops } from "../types/components";
import DeleteModal from "./Modals/DeleteModal";
import EditModal from "./Modals/EditModal";
import { IoMdMore } from "react-icons/io";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Link from "next/link";
import { FaLink } from "react-icons/fa6";
import { useAppContext } from "../context/AppContext";
import { toast } from "sonner";
const Card: NextPage<Cardsprops> = ({
  content,
  date,
  handleDeleteCard,
  handleUpdateDoc,
  id,
  viewMode,
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [moreModal, setMoreModal] = useState(false);

  const handleDeleteModal = () => {
    setShowModal(true);
  };
  const handleEditModal = () => {
    setShowEditModal(true);
  };
  const urlToCopy = `https://noteeey.vercel.app/notes/${id}`;

  const handleCopyNote = () => {
    toast.success("Copied note!");
  };

  const modalRef = useRef<HTMLDivElement>(null);
  const handleClickOutsideModal = (e: any) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setMoreModal(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutsideModal);

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideModal);
    };
  }, []);

  const { color } = useAppContext();
  const borderStyle = color ? { borderLeftColor: color } : {};

  return (
    <section className="w-full">
      <div
        className={`dark:bg-[#2C2C2C] bg-gray-200 p-4 mb-4 rounded-md border-l-4 
         ${viewMode === "grid" ? "w-[288px]" : "w-full"}`}
        style={borderStyle}
      >
        <div className="flex justify-between gap-2 items-center text-xl mb-2">
          <Link href={`/notes/${id}`}>
            <h2 className="font-semibold cursor-pointer hover:opacity-80 dark:text-[#D6D6D6] text-black transition-all duration-300 text-wrap w-42">
              {content}
            </h2>
          </Link>
          <button
            onClick={() => setMoreModal(!moreModal)}
            className="text-black dark:text-[#D6D6D6] hover:dark:bg-[#222] hover:bg-gray-100 opacity-80 rounded-lg p-2 transition-all duration-300"
          >
            <IoMdMore />
          </button>
        </div>
        <p className="text-gray-500 dark:text-[#747373]">{date}</p>
      </div>
      {moreModal && (
        <div
          ref={modalRef}
          className="dark:text-white text-text absolute w-[192px] rounded-lg dark:bg-[#282828] bg-gray-200"
        >
          <ul className="flex flex-col gap-3 p-2">
            <li
              onClick={handleEditModal}
              className="flex gap-3 rounded-lg cursor-pointer p-3 hover:bg-gray-300 dark:hover:bg-[#1e1e1e] transition-all duration-30"
            >
              <MdEdit size={20} />
              <p>Rename</p>{" "}
            </li>
            <CopyToClipboard text={urlToCopy}>
              <li
                onClick={handleCopyNote}
                className="flex gap-3 rounded-lg cursor-pointer p-3 hover:bg-gray-300 dark:hover:bg-[#1e1e1e] transition-all duration-30"
              >
                <FaLink size={20} />
                <p>Copy url</p>
              </li>
            </CopyToClipboard>
            <li
              onClick={handleDeleteModal}
              className="flex gap-3 rounded-lg cursor-pointer p-3 hover:bg-gray-300 dark:hover:bg-[#1e1e1e] transition-all duration-30 dark:text-red-400 text-red-600"
            >
              <MdDelete size={20} />
              <p>Delete</p>
            </li>
          </ul>
        </div>
      )}

      <EditModal
        setShow={setShowEditModal}
        show={showEditModal}
        id={id}
        header="Edit your note title"
        handleUpdateDoc={handleUpdateDoc}
        content={content}
        buttonContent="Update"
      />
      <DeleteModal
        show={showModal}
        setShow={setShowModal}
        content={content}
        buttonContent="Delete"
        handleDeleteCard={handleDeleteCard}
        id={id}
      />
    </section>
  );
};

export default Card;
